'use client';

import { useState } from 'react';
import type { SpeakingAssessmentResponse, PronunciationErrorItem } from '@/lib/assessments';

interface AssessmentResultCardProps {
  assessment: SpeakingAssessmentResponse;
  onRetry: () => void;
  onNext?: () => void;
}

export function AssessmentResultCard({ assessment, onRetry, onNext }: AssessmentResultCardProps) {
  const [selectedWord, setSelectedWord] = useState<PronunciationErrorItem | null>(null);
  const [activeTab, setActiveTab] = useState<'feedback' | 'dimensions'>('feedback');

  const { overallScore, cefrLevel, ieltsBand, details, feedback, errors, transcript } = assessment;

  // Split transcript into words for word-level pronunciation highlights
  const words = transcript ? transcript.split(/\s+/) : [];
  const errorMap = new Map<string, PronunciationErrorItem>();
  errors.forEach((err) => {
    errorMap.set(err.word.toLowerCase().replace(/[^a-z]/g, ''), err);
  });

  const isPassed = overallScore >= 60;

  return (
    <div className="w-full space-y-6 rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-2xl backdrop-blur-xl">
      {/* Top Banner: Score & CEFR / IELTS Badges */}
      <div className="flex flex-col items-center justify-between gap-6 border-b border-slate-800 pb-6 sm:flex-row">
        <div className="flex items-center gap-5">
          {/* Circular Score Gauge */}
          <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-1000 ${
                  isPassed ? 'stroke-indigo-500' : 'stroke-amber-500'
                }`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * Math.min(100, overallScore)) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black tracking-tight text-white">
                {Math.round(overallScore)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isPassed
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isPassed ? 'Passed Practice' : 'Needs More Practice'}
              </span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400">
                CEFR {cefrLevel}
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
                IELTS {ieltsBand}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-white">
              {overallScore >= 80
                ? 'Outstanding Speaking Performance!'
                : overallScore >= 60
                ? 'Solid Speaking Attempt!'
                : 'Good Effort — Keep Practicing!'}
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across 5 dimensions: Pronunciation, Fluency, Grammar, Vocabulary, and Coherence.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          {onNext && isPassed && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              Continue
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Word-Level Pronunciation Breakdown */}
      {words.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Word-by-Word Pronunciation Analysis
            </span>
            <span className="text-[11px] text-slate-400">
              Click mispronounced words for phonetics
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 leading-relaxed">
            {words.map((w, idx) => {
              const clean = w.toLowerCase().replace(/[^a-z]/g, '');
              const err = errorMap.get(clean);
              const isError = Boolean(err);

              return (
                <button
                  key={`${w}-${idx}`}
                  type="button"
                  onClick={() => err && setSelectedWord(err)}
                  className={`rounded-lg px-2.5 py-1 text-sm font-medium transition ${
                    isError
                      ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                      : 'border border-emerald-500/20 bg-emerald-500/5 text-slate-200 hover:border-emerald-500/40'
                  }`}
                >
                  {w}
                  {isError && (
                    <span className="ml-1 text-[10px] text-amber-400 font-bold">!</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Modal/Tooltip for selected word phonetics */}
          {selectedWord && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <div className="flex items-center gap-3">
                <span className="font-bold uppercase text-white">{selectedWord.word}</span>
                <span>
                  Expected: <strong className="font-mono text-emerald-400">{selectedWord.expectedPronunciation || `/${selectedWord.word}/`}</strong>
                </span>
                <span>
                  Heard: <strong className="font-mono text-amber-400">{selectedWord.actualPronunciation || '[unclear]'}</strong>
                </span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase font-bold">
                  {selectedWord.severity} severity
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWord(null)}
                className="text-amber-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs Switcher: 5 Dimensions vs AI Feedback */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'feedback'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Feedback & Tips
        </button>
        <button
          onClick={() => setActiveTab('dimensions')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'dimensions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          5-Dimension Score Breakdown
        </button>
      </div>

      {/* Tab 1: AI Feedback Cards */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Strengths */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider">Strengths</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {feedback.strengths || 'Clear articulation and strong speaking confidence.'}
            </p>
          </div>

          {/* Weaknesses */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider">Areas to Improve</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {feedback.weaknesses || 'Reduce hesitations and polish multisyllabic word stress.'}
            </p>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider">Actionable Tips</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {feedback.recommendations || 'Practice linking words (e.g. therefore, furthermore) to sound more natural.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: 5 Dimensions Progress Meters */}
      {activeTab === 'dimensions' && (
        <div className="space-y-3">
          {[
            { label: 'Pronunciation', weight: '25%', score: details.pronunciationScore, color: 'bg-indigo-500' },
            { label: 'Fluency', weight: '20%', score: details.fluencyScore, color: 'bg-cyan-500' },
            { label: 'Grammar', weight: '20%', score: details.grammarScore, color: 'bg-emerald-500' },
            { label: 'Vocabulary', weight: '20%', score: details.vocabularyScore, color: 'bg-violet-500' },
            { label: 'Coherence', weight: '15%', score: details.coherenceScore, color: 'bg-amber-500' },
          ].map((dim) => (
            <div key={dim.label} className="rounded-xl bg-slate-900/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  {dim.label} <span className="text-slate-400 font-normal">({dim.weight})</span>
                </span>
                <span className="font-bold text-slate-200">{Math.round(dim.score)}/100</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full ${dim.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(5, dim.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
