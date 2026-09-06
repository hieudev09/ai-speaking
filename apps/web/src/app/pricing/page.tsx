'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SubscriptionPlanDto, UserSubscriptionDto } from '@ai-platform/types';
import { getSubscriptionPlans, getCurrentSubscription } from '../../lib/subscriptions';
import { createCheckout, mockCompletePayment } from '../../lib/payments';
import { NotificationBell } from '../../components/NotificationBell';

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [currentSub, setCurrentSub] = useState<UserSubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          getSubscriptionPlans().catch(() => []),
          getCurrentSubscription().catch(() => null),
        ]);
        setPlans(plansRes);
        setCurrentSub(subRes);
      } catch (err) {
        console.error('Failed to load plans', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlanDto) => {
    if (plan.price === 0) {
      router.push('/conversations');
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const res = await createCheckout({
        planId: plan.id,
        successUrl: `${window.location.origin}/pricing/success?plan_id=${plan.id}`,
        cancelUrl: `${window.location.origin}/pricing/cancel`,
      });

      if (res.isMock) {
        // Instant sandbox upgrade for dev testing
        await mockCompletePayment(plan.id);
        router.push(`/pricing/success?plan_id=${plan.id}&mock=true`);
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err: any) {
      console.error('Checkout failed', err);
      // Fallback sandbox test
      try {
        await mockCompletePayment(plan.id);
        router.push(`/pricing/success?plan_id=${plan.id}&mock=true`);
      } catch {
        alert(err.message || 'Payment initiation failed');
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎙️</span>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Daily speaking with me (DSWM)
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/conversations" className="transition hover:text-white">
              AI Practice
            </Link>
            <Link href="/courses" className="transition hover:text-white">
              Courses
            </Link>
            <Link href="/pricing" className="text-indigo-400 font-semibold">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-12 text-center max-w-4xl mx-auto">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Monetization & Unlimited AI Practice
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Simple, Transparent Pricing for{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            English Mastery
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg mb-8">
          Start for free with daily practice sessions, or unlock unlimited AI conversation, advanced pronunciation forensics, and IELTS examiner prep.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 text-xs font-medium">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-xl px-4 py-2 transition ${
              billingCycle === 'monthly'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-xl px-4 py-2 transition flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
              Save 33%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {/* Free Tier */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition hover:border-slate-700">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Free Starter</h3>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  Current
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Perfect for casual learners building a steady speaking habit.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-sm text-slate-500"> / forever</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> 10 AI conversations per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> 5-dimension speech assessment
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Foundational course access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Daily streak tracking
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <span className="text-slate-600">✕</span> Unlimited conversations
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <span className="text-slate-600">✕</span> IELTS & Interview examiner personas
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/conversations')}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition"
            >
              Practice Free
            </button>
          </div>

          {/* Premium Monthly */}
          <div className="flex flex-col justify-between rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-900/90 p-8 backdrop-blur-md relative transition hover:border-indigo-500/70">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Premium Monthly</h3>
                <span className="rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 text-xs font-semibold">
                  Flexible
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Full access with monthly flexibility for intensive exam and interview preparation.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">$9.99</span>
                <span className="text-sm text-slate-500"> / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">✓</span> <strong>Unlimited</strong> AI conversations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">✓</span> Deep phoneme & syllable stress analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">✓</span> IELTS, Job Interview & Business personas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">✓</span> Adaptive weakness recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">✓</span> Priority processing queue
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                const plan = plans.find((p) => p.name.includes('Monthly')) || plans[1];
                if (plan) handleSubscribe(plan);
              }}
              disabled={checkoutLoading !== null}
              className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {checkoutLoading ? 'Processing...' : 'Upgrade Monthly'}
            </button>
          </div>

          {/* Premium Yearly — Highlighted */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-900/50 via-slate-900/90 to-purple-950/40 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-md relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
              Most Popular · Save 33%
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-1">
                <h3 className="text-xl font-bold text-white">Premium Yearly</h3>
                <span className="rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1 text-xs font-semibold">
                  Best Value
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Best for determined learners committed to achieving true English fluency.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">$79.99</span>
                <span className="text-sm text-slate-500"> / year</span>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  Just $6.66/month billed annually
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-pink-400 font-bold">✓</span> <strong>Everything</strong> in Monthly plan
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400 font-bold">✓</span> <strong>Unlimited</strong> AI practice 365 days
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400 font-bold">✓</span> Exclusive IELTS Cue Card mock exam suite
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400 font-bold">✓</span> Custom AI tutor role customization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-400 font-bold">✓</span> VIP Certificate of Completion
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                const plan = plans.find((p) => p.name.includes('Yearly')) || plans[2];
                if (plan) handleSubscribe(plan);
              }}
              disabled={checkoutLoading !== null}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:opacity-95 transition disabled:opacity-50"
            >
              {checkoutLoading ? 'Redirecting...' : 'Get Yearly Fluency Pass'}
            </button>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mt-20 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Detailed Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-center">Free Starter</th>
                  <th className="py-3 px-4 text-center">Premium Monthly</th>
                  <th className="py-3 px-4 text-center">Premium Yearly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Daily AI Practice Allowance</td>
                  <td className="py-3 px-4 text-center text-slate-400">10 Sessions / Day</td>
                  <td className="py-3 px-4 text-center text-indigo-400 font-bold">Unlimited</td>
                  <td className="py-3 px-4 text-center text-pink-400 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">5-Dimension Assessment</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Standard</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Advanced</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Deep Forensics</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">AI Personas (Teacher, Friend)</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">IELTS & Interview Examiners</td>
                  <td className="py-3 px-4 text-center text-slate-600">✕</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Full Library</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Streak & Achievement Rewards</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Multiplier</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Personalized Weakness Engine</td>
                  <td className="py-3 px-4 text-center text-slate-400">Basic</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Real-time</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Real-time + RAG</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
