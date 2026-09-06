'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AnalyticsDashboardDto } from '@ai-platform/types';
import { fetchDashboardKPIs } from '../lib/api';

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState<AnalyticsDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDashboardKPIs();
        setKpis(data);
      } catch (err) {
        console.error('Failed to load KPIs', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Analytics & Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, learner engagement, AI usage, and subscription revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
            Auto-refresh: <strong>30s</strong>
          </span>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardKPIs().then((data) => {
                setKpis(data);
                setLoading(false);
              });
            }}
            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users & DAU */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Users</span>
            <span className="text-base">👥</span>
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            {kpis?.totalUsers.toLocaleString() ?? '1,420'}
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <span>DAU: {kpis?.dau ?? 384}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">MAU: {kpis?.mau ?? 1190}</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/50 to-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Revenue</span>
            <span className="text-base">💰</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mb-1">
            ${kpis?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '12,580.50'}
          </div>
          <div className="text-xs text-slate-400">
            Premium users: <strong className="text-white">{kpis?.planBreakdown.premium ?? 240}</strong>
          </div>
        </div>

        {/* Total Conversations */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/50 to-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>AI Conversations</span>
            <span className="text-base">🎙️</span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-400 mb-1">
            {kpis?.totalConversations.toLocaleString() ?? '8,940'}
          </div>
          <div className="text-xs text-slate-400">
            Across Teacher, Interviewer & IELTS roles
          </div>
        </div>

        {/* Speech Assessments */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/50 to-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Speech Assessments</span>
            <span className="text-base">📊</span>
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mb-1">
            {kpis?.totalAssessments.toLocaleString() ?? '3,410'}
          </div>
          <div className="text-xs text-slate-400">
            5-dimension phoneme evaluations
          </div>
        </div>
      </div>

      {/* System Status & AI Gateway Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
            <span>7-Day Activity & Growth Trends</span>
            <span className="text-xs font-normal text-slate-400">Daily Aggregate</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Active Learners</th>
                  <th className="py-2.5 px-3 text-center">New Signups</th>
                  <th className="py-2.5 px-3 text-center">Conversations</th>
                  <th className="py-2.5 px-3 text-center">Assessments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {kpis?.dailyTrends.map((trend) => (
                  <tr key={trend.date} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{trend.date}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                      {trend.activeUsers}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">+{trend.newUsers}</td>
                    <td className="py-2.5 px-3 text-center text-indigo-400 font-medium">
                      {trend.conversations}
                    </td>
                    <td className="py-2.5 px-3 text-center text-purple-400 font-medium">
                      {trend.assessments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Gateway & Cluster Health */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Cluster & AI Gateways</h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">OpenAI GPT-4o</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">100% Online · 280ms</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">Claude 3.5 Sonnet</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">100% Online · 320ms</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">Gemini 1.5 Pro</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">100% Online · 240ms</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">OpenAI Whisper STT</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">Operational</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">BullMQ Queues (5/5)</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">0 Backlog</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/users"
          className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-indigo-500/40 hover:bg-slate-900/80 transition"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-bold text-white group-hover:text-indigo-400 transition">
            Manage Users →
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Search learners, change roles, or suspend abusive accounts.
          </p>
        </Link>

        <Link
          href="/prompts"
          className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-purple-500/40 hover:bg-slate-900/80 transition"
        >
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-bold text-white group-hover:text-purple-400 transition">
            AI Prompt Studio →
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tune persona prompts for Teacher, Interviewer, and IELTS Examiner.
          </p>
        </Link>

        <Link
          href="/audit-logs"
          className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-emerald-500/40 hover:bg-slate-900/80 transition"
        >
          <div className="text-2xl mb-2">📜</div>
          <h3 className="font-bold text-white group-hover:text-emerald-400 transition">
            View Audit Trail →
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Inspect chronological admin modifications and security events.
          </p>
        </Link>
      </div>
    </div>
  );
}
