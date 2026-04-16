import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    draft: { icon: FileText, color: 'text-stone-500 bg-stone-100', label: 'Draft' },
    analyzing: { icon: Clock, color: 'text-amber-700 bg-amber-100', label: 'Analyzing...' },
    complete: { icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-100', label: 'Complete' },
    error: { icon: AlertCircle, color: 'text-red-700 bg-red-100', label: 'Error' },
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar userEmail={user.email} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-stone-900 font-display">Dashboard</h2>
            <p className="text-stone-600 mt-1">Tumhare sab SEO intelligence projects</p>
          </div>
          <Link
            href="/projects/new"
            className="px-5 py-3 rounded-xl bg-stone-900 text-amber-50 font-semibold text-sm hover:bg-stone-800 transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Analysis
          </Link>
        </div>

        {/* Projects list */}
        {!projects || projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <Sparkles className="w-12 h-12 text-amber-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-900 font-display mb-2">Abhi tak koi project nahi</h3>
            <p className="text-stone-600 mb-6">Pehla SEO analysis shuru karo — 25 deliverables 2–4 minutes mein.</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-amber-50 font-semibold hover:bg-stone-800 transition"
            >
              <Plus className="w-4 h-4" /> New Analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const sc = statusConfig[p.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              const date = new Date(p.created_at).toLocaleDateString('en-PK', {
                day: 'numeric', month: 'short', year: 'numeric',
              });
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between p-5 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-amber-50 transition">
                      <FileText className="w-5 h-5 text-stone-600 group-hover:text-amber-800 transition" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-stone-900 truncate">{p.keyword}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{date}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {sc.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
