'use client';

import Link from 'next/link';
import { Layers, LogOut } from 'lucide-react';

export default function Navbar({ userEmail }: { userEmail?: string | null }) {
  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-stone-900 text-amber-50 rounded-md flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900 font-display leading-tight">SEO Intelligence</h1>
            <p className="text-xs text-stone-500 -mt-0.5">Research → Blueprint → Writing system</p>
          </div>
        </Link>
        {userEmail && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600 hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-stone-100 transition"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
