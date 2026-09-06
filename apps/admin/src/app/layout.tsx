import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'DSWM Admin — Operations Portal',
  description: 'Mission control dashboard for Daily speaking with me (DSWM) — Analytics, Users, Prompts, and Courses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex">
        {/* Admin Persistent Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between hidden md:flex shrink-0">
          <div>
            {/* Brand Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DSWM ADMIN
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Daily speaking with me
                </span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="p-4 space-y-1.5 text-xs font-semibold">
              <Link
                href="/"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                <span className="text-base">📊</span>
                <span>Overview & KPIs</span>
              </Link>
              <Link
                href="/users"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                <span className="text-base">👥</span>
                <span>User Management</span>
              </Link>
              <Link
                href="/prompts"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                <span className="text-base">🤖</span>
                <span>AI Prompt Studio</span>
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                <span className="text-base">📚</span>
                <span>Course Content</span>
              </Link>
              <Link
                href="/audit-logs"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                <span className="text-base">📜</span>
                <span>Audit Logs</span>
              </Link>
            </nav>
          </div>

          {/* Admin profile footer */}
          <div className="p-4 border-t border-slate-800/80">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">Super Admin</p>
                <p className="text-[10px] text-slate-400 truncate">admin@ai-speaking.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">
                Cluster: <strong className="text-white">ai-platform-prod-01</strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 text-[11px] font-bold">
                v1.0 Production
              </span>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <span>Learner App</span>
                <span>↗</span>
              </a>
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
