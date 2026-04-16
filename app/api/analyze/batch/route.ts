import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude';
import { buildSourceBlock, buildBatchPrompt, parseBatchResponse } from '@/lib/prompts';
import { BATCHES, DELIVERABLES } from '@/lib/deliverables';

export const maxDuration = 120; // Allow up to 2 min for Claude calls (Vercel Pro)

export async function POST(request: NextRequest) {
  try {
    // Verify user is logged in
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, batchIndex } = body;

    if (batchIndex === undefined || !projectId) {
      return NextResponse.json({ error: 'Missing projectId or batchIndex' }, { status: 400 });
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch sources
    const { data: sources } = await supabase
      .from('sources')
      .select('*')
      .eq('project_id', projectId)
      .order('source_type')
      .order('source_number');

    const competitors = (sources || [])
      .filter((s) => s.source_type === 'competitor')
      .sort((a, b) => a.source_number - b.source_number)
      .map((s) => s.content);

    const externals = (sources || [])
      .filter((s) => s.source_type === 'external')
      .sort((a, b) => a.source_number - b.source_number)
      .map((s) => s.content);

    // Build prompt
    const sourceBlock = buildSourceBlock(project.keyword, competitors, externals);
    const prompt = buildBatchPrompt(batchIndex, sourceBlock);
    const batch = BATCHES[batchIndex];

    // Update deliverables to "running"
    for (const id of batch.ids) {
      await supabase
        .from('deliverables')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('deliverable_number', id);
    }

    // Call Claude
    const responseText = await callClaude(prompt);
    const parsed = parseBatchResponse(responseText, batch.ids);

    // Save results
    for (const id of batch.ids) {
      const content = parsed[id] || 'No output generated for this deliverable.';
      await supabase
        .from('deliverables')
        .update({
          content,
          status: 'done',
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('deliverable_number', id);
    }

    return NextResponse.json({ success: true, results: parsed });
  } catch (err: any) {
    console.error('Batch analysis error:', err);

    // Try to mark deliverables as error
    try {
      const supabase = createClient();
      const body = await request.clone().json();
      const batch = BATCHES[body.batchIndex];
      if (batch) {
        for (const id of batch.ids) {
          await supabase
            .from('deliverables')
            .update({ status: 'error', content: `Error: ${err.message}`, updated_at: new Date().toISOString() })
            .eq('project_id', body.projectId)
            .eq('deliverable_number', id);
        }
      }
    } catch (_) {}

    return NextResponse.json(
      { error: err.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
