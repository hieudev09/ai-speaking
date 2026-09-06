'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createConversation,
  getConversations,
  deleteConversation,
  type ConversationItem,
} from '@/lib/conversations';

const AI_ROLES = [
  {
    id: 'Teacher',
    title: 'English Teacher',
    icon: '🎓',
    desc: 'Patient tutor providing helpful tips, gentle corrections, and structured learning.',
    badge: 'Recommended for All',
    defaultTopic: 'Daily Life & Learning Goals',
  },
  {
    id: 'Interviewer',
    title: 'Job Interviewer',
    icon: '💼',
    desc: 'Simulate realistic corporate job interviews using the behavioral STAR methodology.',
    badge: 'Career & Business',
    defaultTopic: 'Software Engineer Behavioral Interview',
  },
  {
    id: 'Friend',
    title: 'Speaking Partner',
    icon: '☕',
    desc: 'Casual coffee-chat partner using modern idioms, friendly slang, and natural flow.',
    badge: 'Fluency & Fun',
    defaultTopic: 'Weekend Plans & Hobbies',
  },
  {
    id: 'IELTS Examiner',
    title: 'IELTS Examiner',
    icon: '🏛️',
    desc: 'Official Cambridge style examiner conducting Parts 1, 2, and 3 speaking criteria.',
    badge: 'Exam Prep (Band 7.0+)',
    defaultTopic: 'IELTS Speaking Part 2 & 3',
  },
  {
    id: 'Business Partner',
    title: 'Business Executive',
    icon: '📈',
    desc: 'Practice high-stakes board presentations, project negotiations, and corporate diplomacy.',
    badge: 'Executive English',
    defaultTopic: 'Q3 Product Roadmap Negotiation',
  },
];

const SCENARIO_PRESETS = [
  'Daily Conversation',
  'Job Interview',
  'IELTS Speaking',
  'Business Meeting',
  'Travel & Airport',
  'Customer Service',
  'Academic Discussion',
];

export default function ConversationsLobbyPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Teacher');
  const [customTopic, setCustomTopic] = useState('Daily Conversation');
  const [customTitle, setCustomTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await getConversations({ limit: 20 });
      setConversations(res.data ?? []);
    } catch {
      // Offline fallback mock list for preview
      setConversations([
        {
          id: 'demo-1',
          title: 'Teacher Practice: Daily Routine & Fluency',
          topic: 'Daily Conversation',
          aiRole: 'Teacher',
          status: 'active',
          messageCount: 6,
          lastMessage: 'Great explanation! How do you usually prioritize your tasks each morning?',
          lastMessageSender: 'AI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          title: 'IELTS Examiner Simulation: Technology in Modern Life',
          topic: 'IELTS Speaking',
          aiRole: 'IELTS Examiner',
          status: 'ended',
          messageCount: 12,
          lastMessage: 'Thank you. That concludes Part 2. Now let us move on to Part 3.',
          lastMessageSender: 'AI',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = async (role: string, topic: string) => {
    try {
      setCreating(true);
      const conv = await createConversation({
        aiRole: role,
        topic,
        title: `${role} Practice: ${topic}`,
      });
      router.push(`/conversations/${conv.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation. Please sign in or check server.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const conv = await createConversation({
        aiRole: selectedRole,
        topic: customTopic,
        title: customTitle || `${selectedRole} Session: ${customTopic}`,
      });
      setIsModalOpen(false);
      router.push(`/conversations/${conv.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              <span>✨ Phase 5 Engine</span>
              <span>•</span>
              <span>Multi-LLM & RAG Augmented</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Daily speaking with me (DSWM) Studio
            </h1>
            <p className="mt-2 text-slate-400 max-w-xl text-sm md:text-base">
              Practice real-time spoken and written English with customized AI personas. Powered by
              vector knowledge retrieval and multi-turn context memory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={creating}
              className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span>+</span>
              <span>Custom Conversation</span>
            </button>
          </div>
        </div>

        {/* Quota & Feature Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Daily AI Quota</div>
              <div className="text-sm font-semibold text-slate-200">10 Conversations / Day (Free)</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              📚
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">RAG Knowledge Engine</div>
              <div className="text-sm font-semibold text-slate-200">Grammar, IELTS & Business Vectors</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
              🎙️
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Voice & Text Studio</div>
              <div className="text-sm font-semibold text-slate-200">Mic Recording + Text-to-Speech</div>
            </div>
          </div>
        </div>

        {/* AI Personas Selection Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Choose Your AI Partner</span>
              <span className="text-xs font-normal text-slate-400">(Click to start instantly)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AI_ROLES.map((role) => (
              <div
                key={role.id}
                onClick={() => handleQuickStart(role.id, role.defaultTopic)}
                className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-800 group-hover:scale-110 transition-transform">
                      {role.icon}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {role.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{role.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[180px]">Topic: {role.defaultTopic}</span>
                  <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Start →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Conversations List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">Your Conversation History</h2>
            <button
              onClick={loadConversations}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Refresh ↻
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 bg-slate-900/30 rounded-2xl border border-slate-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-slate-400">No conversations yet. Choose an AI partner above to start speaking!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/conversations/${conv.id}`)}
                  className="p-4 sm:p-5 hover:bg-slate-850 hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate max-w-md">
                        {conv.title || 'Untitled Practice Session'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                        {conv.aiRole || 'Teacher'}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          conv.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {conv.status === 'active' ? 'Active' : 'Ended'}
                      </span>
                    </div>

                    {conv.lastMessage && (
                      <p className="text-xs text-slate-400 truncate max-w-xl">
                        <span className="font-semibold text-slate-300">
                          {conv.lastMessageSender === 'AI' ? 'AI: ' : 'You: '}
                        </span>
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <span className="text-xs text-slate-400">
                      {conv.messageCount} {conv.messageCount === 1 ? 'msg' : 'msgs'}
                    </span>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      title="Delete conversation"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      🗑️
                    </button>
                    <Link
                      href={`/conversations/${conv.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-colors"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Custom Session Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Create Custom Speaking Session</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select AI Persona
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-slate-850 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {AI_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.icon} {r.title} ({r.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preset Scenario / Topic
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SCENARIO_PRESETS.map((sc) => (
                      <button
                        type="button"
                        key={sc}
                        onClick={() => setCustomTopic(sc)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          customTopic === sc
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Or type custom topic (e.g. Preparing for Amazon System Design Interview)"
                    className="w-full bg-slate-850 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Session Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Mock Interview with Senior PM"
                    className="w-full bg-slate-850 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
                  >
                    {creating ? 'Starting...' : 'Start Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
