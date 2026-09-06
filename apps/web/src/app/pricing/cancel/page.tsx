'use client';

import Link from 'next/link';

export default function PricingCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-20 text-center text-slate-100">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-10 shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-3xl">
          💳
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Checkout Cancelled</h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          No charges were made. You can continue practicing with your Free plan or review our plans at any time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            Review Plans
          </Link>
          <Link
            href="/conversations"
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-6 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Practice Free
          </Link>
        </div>
      </div>
    </div>
  );
}
