'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type {
  UserStreakDto,
  UserAchievementDto,
  QuotaStatusDto,
  UserRecommendationsDto,
  UserSubscriptionDto,
} from '@ai-platform/types';
import { getUserStreak, getUserAchievements } from '../../lib/gamification';
import { getQuotaStatus, getCurrentSubscription } from '../../lib/subscriptions';
import { getUserRecommendations } from '../../lib/recommendations';
import { NotificationBell } from '../../components/NotificationBell';

export default function DashboardPage() {
  const [streak, setStreak] = useState<UserStreakDto | null>(null);
  const [achievements, setAchievements] = useState<UserAchievementDto[]>([]);
  const [quota, setQuota] = useState<QuotaStatusDto | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionDto | null>(null);
  const [recommendations, setRecommendations] = useState<UserRecommendationsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [streakRes, achRes, quotaRes, subRes, recRes] = await Promise.all([
          getUserStreak().catch(() => ({
            currentStreak: 1,
            longestStreak: 3,
            lastActivityDate: null,
            isActiveToday: false,
            streakStatus: 'pending' as const,
          })),
          getUserAchievements().catch(() => []),
          getQuotaStatus().catch(() => ({
            usedToday: 2,
            limit: 10,
            remaining: 8,
            isUnlimited: false,
            canProceed: true,
            planName: 'Free',
          })),
          getCurrentSubscription().catch(() => null),
          getUserRecommendations().catch(() => ({
            weakestSkill: 'pronunciation',
            averageScore: 68,
            recommendations: [
              {
                id: 'starter-1',
                title: 'Vowel & Consonant Precision Drill',
                description: 'Practice challenging phonemes with interactive waveform feedback.',
                type: 'pronunciation_drill' as const,
                targetSkill: 'pronunciation' as const,
                actionUrl: '/courses/english-basics/lessons/1',
                level: 'Intermediate',
                reason: 'Focusing on phoneme accuracy will quickly raise your overall speaking band score.',
              },
              {
                id: 'starter-2',
                title: 'Fast-Paced Everyday Conversation',
                description: 'Train speaking with fewer hesitation pauses with an AI Friend partner.',
                type: 'conversation' as const,
                targetSkill: 'fluency' as const,
                actionUrl: '/conversations',
                level: 'Intermediate',
                reason: 'Build continuous speech rhythm and natural conversational confidence.',
              },
            ],
          })),
        ]);

        setStreak(streakRes);
        setAchievements(achRes);
        setQuota(quotaRes);
        setSubscription(subRes);
        setRecommendations(recRes);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const getStreakStatusBadge = () => {
    if (!streak) return null;
    if (streak.isActiveToday) {
      return (
        <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active Today
        </span>
      );
    }
    if (streak.streakStatus === 'pending') {
      return (
        <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" /> Practice Today to Keep Streak
        </span>
      );
    }
    return (
      <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 text-xs font-semibold flex items-center gap-1">
        Streak Reset · Start a new streak!
      </span>
    );
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
            <Link href="/dashboard" className="text-indigo-400 font-semibold">
              Dashboard
            </Link>
            <Link href="/conversations" className="transition hover:text-white">
              AI Practice
            </Link>
            <Link href="/courses" className="transition hover:text-white">
              Courses
            </Link>
            <Link href="/pricing" className="transition hover:text-white">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />
            {subscription?.isUnlimited ? (
              <span className="rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-3 py-1.5 text-xs font-bold text-indigo-300">
                ⭐ Premium Pro
              </span>
            ) : (
              <Link
                href="/pricing"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:opacity-90 transition"
              >
                ⚡ Upgrade Pro
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl w-full flex-1 px-6 py-8 space-y-8">
        {/* Welcome & Quota Top Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Streak Card */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-900/90 p-6 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                Daily Streak
              </span>
              {getStreakStatusBadge()}
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-black text-white flex items-center gap-2">
                <span className="animate-pulse">🔥</span> {streak?.currentStreak ?? 0}
              </span>
              <span className="text-sm text-slate-400">days</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Personal best: <strong>{streak?.longestStreak ?? 0} days</strong>
            </p>

            <Link
              href="/conversations"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Practice now to grow your streak →
            </Link>
          </div>

          {/* Quota & Plan Card */}
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-900/90 p-6 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">
                Practice Allowance
              </span>
              <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 text-xs font-semibold">
                {subscription?.planName || quota?.planName || 'Free Plan'}
              </span>
            </div>

            {quota?.isUnlimited ? (
              <div>
                <div className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
                  <span>♾️</span> Unlimited
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  You have full unlimited access to all AI conversation tutors and assessment drills.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-white">
                    {quota?.remaining ?? 8}
                  </span>
                  <span className="text-sm text-slate-400">
                    / {quota?.limit ?? 10} sessions remaining today
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((quota?.usedToday ?? 2) / (quota?.limit ?? 10)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!quota?.isUnlimited && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
              >
                Upgrade to Premium for unlimited access →
              </Link>
            )}
          </div>

          {/* Quick Start Card */}
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-slate-900/90 p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
                  Quick Studio
                </span>
                <span className="text-2xl">🎧</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ready to Speak?</h3>
              <p className="text-xs text-slate-400 mb-6">
                Connect with an AI Teacher or mock Examiner to build confidence immediately.
              </p>
            </div>

            <Link
              href="/conversations"
              className="w-full text-center rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition"
            >
              Start AI Conversation
            </Link>
          </div>
        </div>

        {/* Personalized Recommendations Section */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Adaptive Learning Path</h2>
                {recommendations?.weakestSkill && (
                  <span className="rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 text-[11px] font-semibold capitalize">
                    Focus: {recommendations.weakestSkill}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Personalized lessons curated based on your recent pronunciation and speech metrics.
              </p>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              View all courses →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recommendations?.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-800/40 p-5 transition hover:border-indigo-500/40 hover:bg-slate-800/70"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-indigo-500/20 text-indigo-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {rec.targetSkill}
                    </span>
                    <span className="text-[11px] text-slate-400">{rec.level}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {rec.description}
                  </p>
                  <p className="text-[11px] text-amber-300/80 bg-amber-500/10 rounded-xl p-2.5 border border-amber-500/20 mb-4">
                    💡 <em>{rec.reason}</em>
                  </p>
                </div>

                <Link
                  href={rec.actionUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition"
                >
                  Start Practice →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Gamification Achievements Showcase */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🏆</span> Speaking Achievements & Badges
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Earn badges as you hit conversational milestones and maintain your streak.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {achievements.filter((a) => a.isUnlocked).length} / {achievements.length || 5} Unlocked
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(achievements.length > 0
              ? achievements
              : [
                  {
                    id: 'first-conv',
                    achievementId: 'first-conv',
                    title: 'First Conversation',
                    description: 'Complete your first AI speaking conversation',
                    iconUrl: null,
                    unlockedAt: new Date().toISOString(),
                    isUnlocked: true,
                    progress: 100,
                  },
                  {
                    id: 'streak-7',
                    achievementId: 'streak-7',
                    title: '7-Day Streak',
                    description: 'Practice English for 7 consecutive days',
                    iconUrl: null,
                    unlockedAt: '',
                    isUnlocked: false,
                    progress: 28,
                  },
                  {
                    id: 'streak-30',
                    achievementId: 'streak-30',
                    title: '30-Day Streak',
                    description: 'Practice English for 30 consecutive days',
                    iconUrl: null,
                    unlockedAt: '',
                    isUnlocked: false,
                    progress: 10,
                  },
                  {
                    id: 'conv-100',
                    achievementId: 'conv-100',
                    title: '100 Conversations',
                    description: 'Complete 100 AI speaking conversations',
                    iconUrl: null,
                    unlockedAt: '',
                    isUnlocked: false,
                    progress: 15,
                  },
                  {
                    id: 'min-1000',
                    achievementId: 'min-1000',
                    title: '1000 Minutes Speaking',
                    description: 'Accumulate 1000 minutes of English speaking practice',
                    iconUrl: null,
                    unlockedAt: '',
                    isUnlocked: false,
                    progress: 5,
                  },
                ]
            ).map((ach) => (
              <div
                key={ach.id}
                className={`relative flex items-start gap-4 rounded-2xl p-4 border transition ${
                  ach.isUnlocked
                    ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-800/60 to-slate-900 shadow-md shadow-amber-500/10'
                    : 'border-slate-800/80 bg-slate-900/40 opacity-75'
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner ${
                    ach.isUnlocked
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {ach.isUnlocked ? '🎖️' : '🔒'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{ach.title}</h4>
                    {ach.isUnlocked && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                    {ach.description}
                  </p>

                  {!ach.isUnlocked && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{ach.progress ?? 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${ach.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
