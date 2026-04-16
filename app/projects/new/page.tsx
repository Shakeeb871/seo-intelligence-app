'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { DELIVERABLES } from '@/lib/deliverables';
import { ChevronRight, ChevronDown, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '', '', '']);
  const [externals, setExternals] = useState(['', '', '', '', '']);
  const [expandedComp, setExpandedComp] = useState<Record<number, boolean>>({ 0: true });
  const [expandedExt, setExpandedExt] = useState<Record<number, boolean>>({});
  const [showExt, setShowExt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filledCompetitors = competitors.filter((c) => c.trim().length > 100).length;
  const canAnalyze = keyword.trim().length > 0 && filledCompetitors >= 2;

  async function handleCreate() {
    if (!canAnalyze) return;
    setSaving(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in first');
        setSaving(false);
        return;
      }

      // Create project
      const { data: project, error: pErr } = await supabase
        .from('projects')
        .insert({ user_id: user.id, keyword: keyword.trim(), status: 'analyzing' })
        .select()
        .single();

      if (pErr || !project) {
        setError(pErr?.message || 'Could not create project');
        setSaving(false);
        return;
      }

      // Insert competitor sources
      const compInserts = competitors
        .map((c, i) => c.trim() ? { project_id: project.id, source_type: 'competitor', source_number: i + 1, content: c.trim() } : null)
        .filter(Boolean);

      if (compInserts.length > 0) {
        await supabase.from('sources').insert(compInserts);
      }

      // Insert external sources
      const extInserts = externals
        .map((e, i) => e.trim() ? { project_id: project.id, source_type: 'external', source_number: i + 1, content: e.trim() } : null)
        .filter(Boolean);

      if (extInserts.length > 0) {
        await supabase.from('sources').insert(extInserts);
      }

      // Create deliverable rows
      const delInserts = DELIVERABLES.map((d) => ({
        project_id: project.id,
        deliverable_number: d.id,
        phase: d.phase,
        title: d.title,
        status: 'pending',
      }));

      await supabase.from('deliverables').insert(delInserts);

      // Redirect to project page (which will start analysis)
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10 fade-up">
          <div className="inline-flex items-center gap-2 text-xs tracking-wider uppercase text-amber-800 bg-amber-100/60 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" /> 25 Deliverables · 20 Steps · 4 Phases
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold text-stone-900 font-display leading-tight mb-3">
            New SEO Analysis
          </h2>
          <p className="text-stone-600 text-lg leading-relaxed max-w-2xl">
            Target keyword aur top 5 competitor articles paste karo. 2–4 minutes mein pura writing blueprint taiyaar.
          </p>
        </div>

        {/* Keyword */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-5 shadow-sm">
          <label className="block text-sm font-semibold text-stone-900 mb-1">Target Keyword</label>
          <p className="text-xs text-stone-500 mb-3">Woh exact keyword jis ke liye content banwana hai.</p>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. best dentist in lahore"
            className="w-full px-4 py-3 text-base border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 transition"
          />
        </div>

        {/* Competitors */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Competitor Articles</h3>
              <p className="text-xs text-stone-500 mt-0.5">Top 5 Google results ka full content paste karo. Minimum 2 zaroori hain.</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${filledCompetitors >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
              {filledCompetitors} / 5 added
            </span>
          </div>
          <div className="space-y-2">
            {competitors.map((c, i) => (
              <div key={i} className="border border-stone-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedComp((p) => ({ ...p, [i]: !p[i] }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    {expandedComp[i] ? <ChevronDown className="w-4 h-4 text-stone-500" /> : <ChevronRight className="w-4 h-4 text-stone-500" />}
                    <span className="text-sm font-medium text-stone-800">Source {i + 1}</span>
                    {c.trim().length > 100 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className="text-xs text-stone-400">{c.trim().length} chars</span>
                </button>
                {expandedComp[i] && (
                  <div className="px-4 pb-4 border-t border-stone-100">
                    <textarea
                      value={c}
                      onChange={(e) => {
                        const newComp = [...competitors];
                        newComp[i] = e.target.value;
                        setCompetitors(newComp);
                      }}
                      placeholder={`Competitor ${i + 1} ka full article yahan paste karo...\n\n(Title + sub-headings + full body text)`}
                      rows={8}
                      className="w-full mt-3 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-700 font-mono resize-y"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Externals */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-8 shadow-sm">
          <button
            type="button"
            onClick={() => setShowExt(!showExt)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h3 className="text-sm font-semibold text-stone-900">External Reference Content <span className="text-stone-400 font-normal">(optional)</span></h3>
              <p className="text-xs text-stone-500 mt-0.5">High-authority articles from industry experts, research reports, etc.</p>
            </div>
            {showExt ? <ChevronDown className="w-4 h-4 text-stone-500" /> : <ChevronRight className="w-4 h-4 text-stone-500" />}
          </button>
          {showExt && (
            <div className="space-y-2 mt-4">
              {externals.map((ext, i) => (
                <div key={i} className="border border-stone-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedExt((p) => ({ ...p, [i]: !p[i] }))}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      {expandedExt[i] ? <ChevronDown className="w-4 h-4 text-stone-500" /> : <ChevronRight className="w-4 h-4 text-stone-500" />}
                      <span className="text-sm font-medium text-stone-800">External Ref {i + 1}</span>
                      {ext.trim().length > 100 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-xs text-stone-400">{ext.trim().length} chars</span>
                  </button>
                  {expandedExt[i] && (
                    <div className="px-4 pb-3 border-t border-stone-100">
                      <textarea
                        value={ext}
                        onChange={(ev) => {
                          const newExt = [...externals];
                          newExt[i] = ev.target.value;
                          setExternals(newExt);
                        }}
                        placeholder={`High-quality reference ${i + 1}...`}
                        rows={6}
                        className="w-full mt-3 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-700 font-mono resize-y"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={!canAnalyze || saving}
          className={`w-full py-4 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2 ${canAnalyze && !saving ? 'bg-stone-900 hover:bg-stone-800 text-amber-50 shadow-md pulse-ring' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Creating project...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> {canAnalyze ? 'Start Intelligence Analysis' : 'Keyword + minimum 2 competitor articles needed'}</>
          )}
        </button>
      </div>
    </div>
  );
}
