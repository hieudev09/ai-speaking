'use client';

import { useState, useEffect } from 'react';
import type { AdminUserDto } from '@ai-platform/types';
import { fetchAdminUsers, updateAdminUser } from '../../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers(search, roleFilter, statusFilter);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleStatusToggle = async (user: AdminUserDto) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setActionLoading(user.id);
    try {
      await updateAdminUser(user.id, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (user: AdminUserDto, newRole: string) => {
    setActionLoading(user.id);
    try {
      await updateAdminUser(user.id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      alert('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage student roles, view practice activity, and enforce security policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 font-semibold">
            {users.length} Users Listed
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="user">User (Free)</option>
            <option value="premium">Premium</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={loadUsers}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-900/80">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4 text-center">Conversations</th>
                <th className="py-3 px-4 text-center">Assessments</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No users match your criteria
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-white">
                          {u.profile?.firstName
                            ? `${u.profile.firstName} ${u.profile.lastName || ''}`
                            : u.email.split('@')[0]}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.role === 'premium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {u.currentPlan}
                    </td>

                    <td className="py-3 px-4 text-center text-indigo-400 font-bold">
                      {u.conversationCount}
                    </td>

                    <td className="py-3 px-4 text-center text-purple-400 font-bold">
                      {u.assessmentCount}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      {u.role !== 'admin' && (
                        <select
                          disabled={actionLoading === u.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                        >
                          <option value="user">User</option>
                          <option value="premium">Premium</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}

                      <button
                        disabled={actionLoading === u.id || u.role === 'admin'}
                        onClick={() => handleStatusToggle(u)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          u.status === 'active'
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
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
