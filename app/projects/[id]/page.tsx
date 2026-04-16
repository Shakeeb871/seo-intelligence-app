'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { DELIVERABLES, BATCHES, PHASE_NAMES } from '@/lib/deliverables';
import { Loader2, CheckCircle2, AlertCircle, BookOpen, ChevronRight, Copy, Download, RotateCcw } from 'lucide-react';

type DeliverableRow = {
  id: string;
  deliverable_number: number;
  phase: number;
  title: string;
  content: string | null;
  status: string;
};

export default function ProjectDetailPage() {
  const { id: projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(-1);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch project data
  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserEmail(user.email || null);

    const { data: proj } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: dels } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .order('deliverable_number');

    if (proj) setProject(proj);
    if (dels) setDeliverables(dels);
    setLoading(false);

    return { proj, dels };
  }, [projectId]);

  // Run analysis for all pending batches
  const runAnalysis = useCallback(async () => {
    setAnalysisRunning(true);

    const supabase = createClient();

    for (let i = 0; i < BATCHES.length; i++) {
      const batch = BATCHES[i];
      setCurrentBatch(i);

      // Check if batch already done
      const { data: batchDels } = await supabase
        .from('deliverables')
        .select('status')
        .eq('project_id', projectId)
        .in('deliverable_number', batch.ids);

      const allDone = batchDels?.every((d) => d.status === 'done');
      if (allDone) continue;

      try {
        const res = await fetch('/api/analyze/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, batchIndex: i }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error(`Batch ${i} failed:`, err);
        }
      } catch (err) {
        console.error(`Batch ${i} error:`, err);
      }

      // Refresh data after each batch
      await fetchData();
    }

    // Mark project as complete
    await supabase
      .from('projects')
      .update({ status: 'complete', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    setCurrentBatch(-1);
    setAnalysisRunning(false);
    await fetchData();
  }, [projectId, fetchData]);

  // Initial load + auto-start
  useEffect(() => {
    fetchData().then(({ proj, dels }) => {
      if (proj && proj.status === 'analyzing') {
        const hasPending = dels?.some((d) => d.status === 'pending' || d.status === 'running');
        if (hasPending) {
          runAnalysis();
        }
      }
    });
  }, [fetchData, runAnalysis]);

  // Retry a single batch
  async function retryBatch(batchIndex: number) {
    setCurrentBatch(batchIndex);
    setAnalysisRunning(true);

    try {
      await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, batchIndex }),
      });
    } catch (err) {
      console.error('Retry failed:', err);
    }

    await fetchData();
    setCurrentBatch(-1);
    setAnalysisRunning(false);
  }

  // Export
  function exportMarkdown() {
    if (!project) return;
    let md = `# SEO Intelligence Report\n\n**Target Keyword:** ${project.keyword}\n**Generated:** ${new Date(project.created_at).toLocaleString()}\n\n---\n\n`;
    DELIVERABLES.forEach((d) => {
      const del = deliverables.find((r) => r.deliverable_number === d.id);
      if (del?.content) md += del.content + '\n\n---\n\n';
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${project.keyword.slice(0, 30).replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyAll() {
    if (!project) return;
    let md = `# SEO Intelligence Report\n\nTarget Keyword: ${project.keyword}\n\n---\n\n`;
    DELIVERABLES.forEach((d) => {
      const del = deliverables.find((r) => r.deliverable_number === d.id);
      if (del?.content) md += del.content + '\n\n---\n\n';
    });
    navigator.clipboard.writeText(md);
  }

  // Current deliverable content
  const currentDel = deliverables.find((d) => d.deliverable_number === selectedId);

  // Batch status helper
  function getBatchStatus(batchIndex: number): 'pending' | 'running' | 'done' | 'error' | 'mixed' {
    const batch = BATCHES[batchIndex];
    const batchDels = deliverables.filter((d) => batch.ids.includes(d.deliverable_number));
    if (batchDels.length === 0) return 'pending';
    if (currentBatch === batchIndex && analysisRunning) return 'running';
    if (batchDels.every((d) => d.status === 'done')) return 'done';
    if (batchDels.some((d) => d.status === 'error')) return 'error';
    if (batchDels.some((d) => d.status === 'running')) return 'running';
    return 'pending';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Project not found</p>
      </div>
    );
  }

  // If still analyzing, show progress
  const isAnalyzing = analysisRunning || project.status === 'analyzing';
  const doneCount = deliverables.filter((d) => d.status === 'done').length;
  const hasErrors = deliverables.some((d) => d.status === 'error');

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 fade-up">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 font-display">
              {isAnalyzing ? 'Analyzing...' : 'Intelligence Report'}
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Keyword: <span className="font-medium text-stone-800">{project.keyword}</span>
              <span className="mx-2 text-stone-300">·</span>
              {doneCount}/25 deliverables
            </p>
          </div>
          {doneCount > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={copyAll} className="text-sm px-3 py-2 rounded-md bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-2 transition">
                <Copy className="w-4 h-4" /> Copy All
              </button>
              <button onClick={exportMarkdown} className="text-sm px-3 py-2 rounded-md bg-stone-900 text-amber-50 hover:bg-stone-800 flex items-center gap-2 transition">
                <Download className="w-4 h-4" /> Download .md
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isAnalyzing && (
          <div className="mb-6 bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-amber-700 animate-spin" />
              <span className="text-sm font-medium text-stone-900">Analysis in progress — {doneCount}/25 deliverables done</span>
            </div>
            <div className="space-y-2">
              {BATCHES.map((batch, i) => {
                const status = getBatchStatus(i);
                return (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${status === 'running' ? 'bg-amber-50 border border-amber-200' : status === 'done' ? 'bg-emerald-50/50' : status === 'error' ? 'bg-red-50' : 'bg-stone-50'}`}>
                    {status === 'running' && <Loader2 className="w-4 h-4 text-amber-700 animate-spin flex-shrink-0" />}
                    {status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    {status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-stone-300 flex-shrink-0" />}
                    <span className="text-stone-700">{batch.label}</span>
                    <span className="text-stone-400 text-xs ml-auto">#{batch.ids.join(', ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="sticky top-24 bg-white rounded-lg border border-stone-200 overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
              {[1, 2, 3, 4].map((phase) => {
                const phaseDels = DELIVERABLES.filter((d) => d.phase === phase);
                return (
                  <div key={phase} className="border-b border-stone-100 last:border-b-0">
                    <div className="px-3 py-2 bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                      Phase {phase} — {PHASE_NAMES[phase]}
                    </div>
                    {phaseDels.map((d) => {
                      const row = deliverables.find((r) => r.deliverable_number === d.id);
                      const hasDone = row?.status === 'done';
                      const hasError = row?.status === 'error';
                      const isSelected = selectedId === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedId(d.id)}
                          className={`w-full text-left px-3 py-2.5 border-l-2 transition hover:bg-stone-50 ${isSelected ? 'border-amber-700 bg-amber-50/50' : 'border-transparent'}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-stone-400 mt-0.5 w-5 flex-shrink-0">{d.id}.</span>
                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-medium truncate ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>{d.title}</div>
                            </div>
                            {hasDone && <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 ml-auto mt-0.5" />}
                            {hasError && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 ml-auto mt-0.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Retry errors */}
            {hasErrors && !analysisRunning && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-800 mb-2">Failed batches — retry:</div>
                {BATCHES.map((b, i) => {
                  const batchDels = deliverables.filter((d) => b.ids.includes(d.deliverable_number));
                  const hasErr = batchDels.some((d) => d.status === 'error');
                  if (!hasErr) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => retryBatch(i)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded bg-white border border-red-200 hover:bg-red-100 text-red-800 mb-1 flex items-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry: {b.label.slice(0, 35)}...
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-xl border border-stone-200 p-8 min-h-[500px] fade-up" key={selectedId}>
              {currentDel?.status === 'done' && currentDel.content ? (
                <MarkdownRenderer content={currentDel.content} />
              ) : currentDel?.status === 'running' ? (
                <div className="flex flex-col items-center justify-center h-64 text-amber-700">
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm font-medium">Yeh deliverable generate ho raha hai...</p>
                </div>
              ) : currentDel?.status === 'error' ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-600">
                  <AlertCircle className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium mb-2">Is deliverable mein error aaya</p>
                  <p className="text-xs text-stone-500">{currentDel.content}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                  <BookOpen className="w-10 h-10 mb-3" />
                  <p className="text-sm">Yeh deliverable abhi pending hai.</p>
                </div>
              )}
            </div>

            {/* Nav arrows */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setSelectedId(Math.max(1, selectedId - 1))}
                disabled={selectedId === 1}
                className="text-sm px-4 py-2 rounded-md bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Previous
              </button>
              <span className="text-xs text-stone-500">Deliverable {selectedId} of 25</span>
              <button
                onClick={() => setSelectedId(Math.min(25, selectedId + 1))}
                disabled={selectedId === 25}
                className="text-sm px-4 py-2 rounded-md bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
