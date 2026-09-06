'use client';

import { useState, useEffect } from 'react';
import type { AdminAuditLogDto } from '@ai-platform/types';
import { fetchAdminAuditLogs } from '../../lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await fetchAdminAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Security & Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological immutable log of all staff actions, permission changes, and template modifications.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-900/80">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Metadata / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records logged yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-lg bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">
                      {log.targetType || 'system'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[150px]">
                      {log.targetId || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {log.metadata ? (
                        <code className="text-slate-400 bg-slate-800/60 px-2 py-1 rounded">
                          {JSON.stringify(log.metadata)}
                        </code>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
