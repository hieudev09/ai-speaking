import type { ReactNode } from 'react';

/**
 * Auth group layout — stub
 * Full auth UI (login, register, forgot password) implemented in Phase 2.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
