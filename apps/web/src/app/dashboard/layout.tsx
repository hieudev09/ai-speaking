import type { ReactNode } from 'react';

/**
 * Dashboard layout — stub
 * Full sidebar navigation and layout implemented in Phase 3.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — implemented in Phase 3 */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold text-indigo-600 text-lg">Daily speaking with me (DSWM)</span>
        </div>
        <nav className="flex-1 p-4">
          <p className="text-sm text-gray-400 px-3 py-2">Navigation — Phase 3</p>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <span className="text-sm text-gray-400">Dashboard — Phase 3</span>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
