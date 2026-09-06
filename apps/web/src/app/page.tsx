export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Daily speaking with me (DSWM)
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Speak English with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Confidence
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl">
          Practice anytime with AI tutors. Get instant pronunciation feedback, real conversation
          scenarios, and a personalized roadmap to fluency — at a fraction of the cost of a
          human tutor.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/dashboard"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 sm:w-auto text-center flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Open Dashboard</span>
          </a>
          <a
            href="/conversations"
            className="w-full rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 sm:w-auto text-center flex items-center justify-center gap-2"
          >
            <span>🎙️</span>
            <span>AI Practice</span>
          </a>
          <a
            href="/pricing"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-8 py-3.5 text-base font-semibold text-slate-300 transition-all hover:border-slate-500 hover:text-white sm:w-auto text-center"
          >
            View Pricing
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-6 text-sm text-slate-500">
          Free tier: 10 daily sessions · No credit card required · Upgrade anytime
        </p>
      </div>

      {/* Feature Cards */}
      <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: '🎤',
            title: 'Pronunciation Analysis',
            desc: 'AI evaluates accuracy, stress, intonation, and clarity in real time.',
          },
          {
            icon: '🤖',
            title: 'AI Conversation',
            desc: 'Chat with Teacher, Interviewer, IELTS Examiner, and more AI personas.',
          },
          {
            icon: '📊',
            title: 'Personalized Roadmap',
            desc: 'Adaptive learning path based on your assessment history and goals.',
          },
          {
            icon: '🏆',
            title: 'Gamified Learning',
            desc: 'Daily streaks, achievements, and progress tracking keep you motivated.',
          },
          {
            icon: '🔍',
            title: 'RAG Knowledge Base',
            desc: 'AI draws from Grammar, IELTS, and Business English knowledge bases.',
          },
          {
            icon: '⚡',
            title: 'Instant Feedback',
            desc: 'Detailed scoring on Fluency, Grammar, Vocabulary, and Coherence.',
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:bg-slate-800/60"
          >
            <div className="mb-3 text-3xl">{icon}</div>
            <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Status notice */}
      <div className="mt-16 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-2 text-sm text-emerald-400">
        ✅ Phase 6 complete — Subscriptions, Stripe Sandbox, Daily Streaks, Achievements & Notifications live
      </div>
    </main>
  );
}
