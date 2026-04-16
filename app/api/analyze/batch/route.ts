import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude';
import { buildSourceBlock, buildBatchPrompt, parseBatchResponse } from '@/lib/prompts';
import { BATCHES, DELIVERABLES } from '@/lib/deliverables';

export const maxDuration = 55;

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    body = await request.json();
    const { projectId, batchIndex } = body;

    if (batchIndex === undefined || !projectId) {
      return NextResponse.json({ error: 'Missing projectId or batchIndex' }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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

    const sourceBlock = buildSourceBlock(project.keyword, competitors, externals);
    const prompt = buildBatchPrompt(batchIndex, sourceBlock);
    const batch = BATCHES[batchIndex];

    for (const id of batch.ids) {
      await supabase
        .from('deliverables')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('deliverable_number', id);
    }

    const responseText = await callClaude(prompt, 4000);
    const parsed = parseBatchResponse(responseText, batch.ids);

    for (const id of batch.ids) {
      const content = parsed[id] || 'No output generated for this deliverable.';
      await supabase
        .from('deliverables')
        .update({ content, status: 'done', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('deliverable_number', id);
    }

    return NextResponse.json({ success: true, results: parsed });
  } catch (err: any) {
    console.error('Batch analysis error:', err);
    try {
      const supabase = createClient();
      if (body.batchIndex !== undefined && body.projectId) {
        const batch = BATCHES[body.batchIndex];
        if (batch) {
          for (const id of batch.ids) {
            await supabase
              .from('deliverables')
              .update({ status: 'error', content: `Error: ${err.message || 'Unknown error'}`, updated_at: new Date().toISOString() })
              .eq('project_id', body.projectId)
              .eq('deliverable_number', id);
          }
        }
      }
    } catch (_) {}
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 });
  }
}
