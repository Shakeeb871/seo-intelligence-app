'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Layers, Sparkles, Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-11 h-11 bg-stone-900 text-amber-50 rounded-md flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-stone-900 font-display leading-tight">SEO Intelligence</h1>
          <p className="text-xs text-stone-500">Master Content Writing System</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
        {!sent ? (
          <>
            <h2 className="text-2xl font-semibold text-stone-900 font-display mb-2">Sign in</h2>
            <p className="text-stone-600 text-sm mb-6">
              Apna email daalo — ek magic link aaye ga. Password ki zarurat nahi.
            </p>

            <form onSubmit={handleLogin}>
              <label className="block text-sm font-medium text-stone-800 mb-1.5">Email address</label>
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="aap@example.com"
                  className="w-full pl-11 pr-4 py-3 text-base border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 mb-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-lg bg-stone-900 text-amber-50 font-semibold text-base hover:bg-stone-800 transition flex items-center justify-center gap-2 disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending link...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Send magic link</>
                )}
              </button>
            </form>

            <p className="text-xs text-stone-500 text-center mt-5">
              Pehli bar? Account automatically ban jaaye ga.
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-stone-900 font-display mb-2">Email bhej di!</h2>
            <p className="text-stone-600 mb-1">
              <strong>{email}</strong> pe ek magic link bheja hai.
            </p>
            <p className="text-stone-500 text-sm mb-6">
              Email kholo → Link pe click karo → App mein aa jao ge. Spam folder bhi check karo.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-sm text-amber-800 hover:text-amber-600 underline"
            >
              Dusra email try karna hai?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
