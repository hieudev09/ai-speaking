'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-20 text-center text-slate-100">
      <div className="relative mx-auto max-w-lg rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-950 p-10 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
        {/* Animated Celebration Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-4xl shadow-xl shadow-emerald-500/30 animate-bounce">
          🎉
        </div>

        <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          Payment Successful
        </span>

        <h1 className="mt-4 text-3xl font-extrabold text-white">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Daily speaking with me (DSWM) Premium!
          </span>
        </h1>

        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
          Your account has been upgraded successfully. You now have unlimited daily speaking practice, advanced pronunciation analysis, and access to all AI examiner roles.
        </p>

        {isMock && (
          <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300">
            ⚡ <strong>Sandbox Mode:</strong> Payment was automatically simulated and verified for testing.
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 transition"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/conversations"
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition"
          >
            Start Speaking Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
