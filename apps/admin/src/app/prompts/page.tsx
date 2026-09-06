'use client';

import { useState, useEffect } from 'react';
import type { PromptTemplateDto } from '@ai-platform/types';
import { fetchAdminPrompts, updateAdminPrompt } from '../../lib/api';

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplateDto[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplateDto | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadPrompts() {
      try {
        const data = await fetchAdminPrompts();
        setPrompts(data);
        if (data.length > 0) {
          selectPrompt(data[0]!);
        }
      } catch (err) {
        console.error('Failed to load prompts', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrompts();
  }, []);

  const selectPrompt = (p: PromptTemplateDto) => {
    setSelectedPrompt(p);
    setSystemPrompt(p.systemPrompt);
    setTemperature(p.temperature);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;
    setSaving(true);
    try {
      const updated = await updateAdminPrompt(selectedPrompt.id, {
        systemPrompt,
        temperature,
      });

      setSelectedPrompt(updated);
      setPrompts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save prompt template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AI Persona Prompt Studio
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Tune pedagogical behavior, interview rigor, and temperature settings across all AI personas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Template List */}
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            AI Personas ({prompts.length})
          </span>

          {prompts.map((p) => {
            const isSelected = selectedPrompt?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectPrompt(p)}
                className={`w-full text-left p-3.5 rounded-xl border transition ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-950/40 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">
                    {p.role || p.name}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-indigo-400">
                    v{p.version}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {p.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Prompt Editor */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-6">
          {selectedPrompt ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Editing: {selectedPrompt.role || selectedPrompt.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Internal key: {selectedPrompt.name} · Current Version: v{selectedPrompt.version}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {savedSuccess && (
                    <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                      ✓ Saved as v{selectedPrompt.version}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Publish Version'}
                  </button>
                </div>
              </div>

              {/* Temperature setting */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Creativity & Temperature:</span>
                  <span className="font-mono text-indigo-400">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0.1 (Deterministic / Strict)</span>
                  <span>0.7 (Balanced Learning)</span>
                  <span>1.0 (Highly Creative)</span>
                </div>
              </div>

              {/* System Prompt Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  System Instructions & Persona Framing:
                </label>
                <textarea
                  rows={12}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter system prompt..."
                />
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs text-indigo-300">
                💡 <strong>Auto-Versioning:</strong> Each save increments the template version. The AI Gateway automatically serves the latest active version with zero server restarts.
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Select an AI persona from the left to inspect and edit its system prompt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
