'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { DELIVERABLES, BATCHES, PHASE_NAMES } from '@/lib/deliverables';
import { Loader2, CheckCircle2, AlertCircle, BookOpen, ChevronRight, Copy, Download, RotateCcw, Play } from 'lucide-react';

type DeliverableRow = {
  id: string;
  deliverable_number: number;
  phase: number;
  title: string;
  content: string | null;
  status: string;
  updated_at: string;
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
  const [statusMsg, setStatusMsg] = useState('');
  const startedRef = useRef(false);

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

  // Reset stuck deliverables (running for more than 3 minutes = stuck)
  async function resetStuckDeliverables() {
    const supabase = createClient();
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    await supabase
      .from('deliverables')
      .update({ status: 'pending', content: null, updated_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('status', 'running')
      .lt('updated_at', threeMinAgo);

    // Also reset any that are still "running" without content
    await supabase
      .from('deliverables')
      .update({ status: 'pending', content: null, updated_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('status', 'running');
  }

  // Run analysis batch by batch
  async function runAnalysis() {
    if (analysisRunning) return;
    setAnalysisRunning(true);
    setStatusMsg('Starting analysis...');

    // Reset any stuck deliverables first
    await resetStuckDeliverables();
    await fetchData();

    const supabase = createClient();

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    for (let i = 0; i < BATCHES.length; i++) {
      const batch = BATCHES[i];
      setCurrentBatch(i);
      setStatusMsg(`Phase ${i + 1}/8: ${batch.label}`);

      // Re-fetch to check latest status
      const { data: batchDels } = await supabase
        .from('deliverables')
        .select('status')
        .eq('project_id', projectId)
        .in('deliverable_number', batch.ids);

      const allDone = batchDels?.every((d) => d.status === 'done');
      if (allDone) {
        setStatusMsg(`Phase ${i + 1}/8: Already done, skipping...`);
        continue;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 58000); // 58s client timeout

        const res = await fetch('/api/analyze/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, batchIndex: i }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`Batch ${i} failed:`, errData);
          setStatusMsg(`Phase ${i + 1}/8: Error — ${errData.error || 'Failed'}. Continuing...`);

          // Mark as error
          for (const id of batch.ids) {
            await supabase
              .from('deliverables')
              .update({
                status: 'error',
                content: `Error: ${errData.error || 'Server returned error'}. Use "Retry" button to try again.`,
                updated_at: new Date().toISOString(),
              })
              .eq('project_id', projectId)
              .eq('deliverable_number', id);
          }
        }
      } catch (err: any) {
        console.error(`Batch ${i} error:`, err);
        const isTimeout = err.name === 'AbortError';
        const errMsg = isTimeout
          ? 'Timeout — server took too long. Retry karein.'
          : (err.message || 'Unknown error');

        setStatusMsg(`Phase ${i + 1}/8: ${errMsg}`);

        // Mark deliverables as error
        for (const id of batch.ids) {
          await supabase
            .from('deliverables')
            .update({
              status: 'error',
              content: `Error: ${errMsg}`,
              updated_at: new Date().toISOString(),
            })
            .eq('project_id', projectId)
            .eq('deliverable_number', id);
        }
      }

      // Refresh after each batch
      await fetchData();
    }

    // Mark project complete (even if some batches failed)
    await supabase
      .from('projects')
      .update({ status: 'complete', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    setCurrentBatch(-1);
    setAnalysisRunning(false);
    setStatusMsg('');
    await fetchData();
  }

  // Retry single batch
  async function retryBatch(batchIndex: number) {
    const batch = BATCHES[batchIndex];
    setCurrentBatch(batchIndex);
    setAnalysisRunning(true);
    setStatusMsg(`Retrying: ${batch.label}`);

    const supabase = createClient();

    // Reset these deliverables to pending first
    for (const id of batch.ids) {
      await supabase
        .from('deliverables')
        .update({ status: 'running', content: null, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('deliverable_number', id);
    }
    await fetchData();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 58000);

      const res = await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, batchIndex }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown' }));
        for (const id of batch.ids) {
          await supabase
            .from('deliverables')
            .update({ status: 'error', content: `Error: ${errData.error}`, updated_at: new Date().toISOString() })
            .eq('project_id', projectId)
            .eq('deliverable_number', id);
        }
      }
    } catch (err: any) {
      for (const id of batch.ids) {
        await supabase
          .from('deliverables')
          .update({ status: 'error', content: `Error: ${err.message || 'Timeout'}`, updated_at: new Date().toISOString() })
          .eq('project_id', projectId)
          .eq('deliverable_number', id);
      }
    }

    await fetchData();
    setCurrentBatch(-1);
    setAnalysisRunning(false);
    setStatusMsg('');
  }

  // Export
  function exportMarkdown() {
    if (!project) return;
    let md = `# SEO Intelligence Report\n\n**Target Keyword:** ${project.keyword}\n**Generated:** ${new Date(project.created_at).toLocaleString()}\n\n---\n\n`;
    DELIVERABLES.forEach((d) => {
      const del = deliverables.find((r) => r.deliverable_number === d.id);
      if (del?.content && del.status === 'done') md += del.content + '\n\n---\n\n';
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
      if (del?.content && del.status === 'done') md += del.content + '\n\n---\n\n';
    });
    navigator.clipboard.writeText(md);
  }

  // Initial load
  useEffect(() => {
    fetchData().then(({ proj, dels }) => {
      // Auto-start ONLY if project is freshly created (analyzing + all pending)
      if (proj && proj.status === 'analyzing' && !startedRef.current) {
        const allPending = dels?.every((d) => d.status === 'pending');
        if (allPending) {
          startedRef.current = true;
          runAnalysis();
        }
      }
    });
  }, []);

  // Current deliverable
  const currentDel = deliverables.find((d) => d.deliverable_number === selectedId);
  const doneCount = deliverables.filter((d) => d.status === 'done').length;
  const errorCount = deliverables.filter((d) => d.status === 'error').length;
  const pendingCount = deliverables.filter((d) => d.status === 'pending' || d.status === 'running').length;
  const hasErrors = errorCount > 0;
  const hasIncomplete = pendingCount > 0 || hasErrors;

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

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar userEmail={userEmail} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 fade-up">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 font-display">
              Intelligence Report
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Keyword: <span className="font-medium text-stone-800">{project.keyword}</span>
              <span className="mx-2 text-stone-300">·</span>
              <span className="text-emerald-700">{doneCount} done</span>
              {errorCount > 0 && <span className="text-red-600 ml-1">· {errorCount} errors</span>}
              {pendingCount > 0 && <span className="text-stone-500 ml-1">· {pendingCount} pending</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Manual start/retry button */}
            {!analysisRunning && hasIncomplete && (
              <button
                onClick={runAnalysis}
                className="text-sm px-4 py-2 rounded-md bg-amber-700 text-white hover:bg-amber-800 flex items-center gap-2 transition font-medium"
              >
                <Play className="w-4 h-4" /> {doneCount > 0 ? 'Continue Analysis' : 'Start Analysis'}
              </button>
            )}
            {doneCount > 0 && (
              <>
                <button onClick={copyAll} className="text-sm px-3 py-2 rounded-md bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-2 transition">
                  <Copy className="w-4 h-4" /> Copy All
                </button>
                <button onClick={exportMarkdown} className="text-sm px-3 py-2 rounded-md bg-stone-900 text-amber-50 hover:bg-stone-800 flex items-center gap-2 transition">
                  <Download className="w-4 h-4" /> Download .md
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar when running */}
        {analysisRunning && (
          <div className="mb-6 bg-white rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-amber-700 animate-spin" />
              <span className="text-sm font-medium text-stone-900">Analysis running...</span>
            </div>
            {statusMsg && (
              <p className="text-sm text-stone-600 bg-amber-50 rounded-lg px-3 py-2">{statusMsg}</p>
            )}
            <div className="mt-3 w-full bg-stone-200 rounded-full h-2">
              <div
                className="bg-amber-700 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / 25) * 100}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-1">{doneCount}/25 deliverables complete</p>
          </div>
        )}

        {/* Info when nothing has run */}
        {!analysisRunning && doneCount === 0 && errorCount === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Play className="w-10 h-10 text-amber-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-stone-900 font-display mb-1">Analysis taiyaar hai</h3>
            <p className="text-sm text-stone-600 mb-4">Upar "Start Analysis" button dabao — 25 deliverables generate honge.</p>
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
                      const isDone = row?.status === 'done';
                      const isError = row?.status === 'error';
                      const isRunning = row?.status === 'running';
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
                            {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 ml-auto mt-0.5" />}
                            {isError && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 ml-auto mt-0.5" />}
                            {isRunning && <Loader2 className="w-3 h-3 text-amber-600 animate-spin flex-shrink-0 ml-auto mt-0.5" />}
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
                <div className="text-xs font-semibold text-red-800 mb-2">Failed — retry individually:</div>
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
                      #{b.ids.join(',')}: {b.label.slice(0, 30)}...
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
                  <p className="text-xs text-stone-500 mt-2">Is mein 30-60 seconds lag sakte hain</p>
                </div>
              ) : currentDel?.status === 'error' ? (
                <div className="flex flex-col items-center justify-center h-64 text-red-600">
                  <AlertCircle className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium mb-2">Is deliverable mein error aaya</p>
                  <p className="text-xs text-stone-500 max-w-md text-center mb-4">{currentDel.content}</p>
                  <p className="text-xs text-stone-500">Left sidebar mein "Retry" button se dobara try karo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                  <BookOpen className="w-10 h-10 mb-3" />
                  <p className="text-sm">Yeh deliverable abhi pending hai.</p>
                  {!analysisRunning && (
                    <p className="text-xs mt-2">Upar "Start Analysis" button dabao</p>
                  )}
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
