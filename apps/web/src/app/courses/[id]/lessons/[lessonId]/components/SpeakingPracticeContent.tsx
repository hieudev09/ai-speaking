'use client';

import { useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioWaveform } from '@/components/AudioWaveform';
import { submitAudioAssessment, type SpeakingAssessmentResponse } from '@/lib/assessments';
import { AssessmentResultCard } from './AssessmentResultCard';

interface SpeakingPracticeContentProps {
  content: {
    prompt?: string;
    sentence?: string;
    topic?: string;
    hint?: string;
    expectedText?: string;
    [key: string]: any;
  };
  lessonId: string;
  onPassed?: () => void;
}

export function SpeakingPracticeContent({
  content,
  lessonId,
  onPassed,
}: SpeakingPracticeContentProps) {
  const {
    status,
    duration,
    audioBlob,
    audioUrl,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
    analyserNode,
  } = useAudioRecorder();

  const [submitting, setSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<SpeakingAssessmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetText = content.expectedText || content.sentence || content.prompt || 'Practice speaking clearly and at a natural pace.';
  const topic = content.topic || 'Speaking Practice';
  const hint = content.hint;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (targetText) {
        formData.append('expectedText', targetText);
      }
      if (lessonId) {
        formData.append('lessonId', lessonId);
      }

      const result = await submitAudioAssessment(formData);
      setAssessmentResult(result);

      if (result.overallScore >= 60) {
        onPassed?.();
      }
    } catch (err: any) {
      setError(err.message || 'Could not analyze speaking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAssessmentResult(null);
    resetRecording();
    setError(null);
  };

  // If assessment result is available, render the result card
  if (assessmentResult) {
    return (
      <AssessmentResultCard
        assessment={assessmentResult}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="w-full space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
      {/* Speaking Exercise Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            🎙️ {topic}
          </span>
          <span className="text-xs text-slate-400">Phase 4 AI Assessment Engine</span>
        </div>
        <h2 className="mt-3 text-lg font-bold text-white">Read Aloud or Answer the Prompt:</h2>
        <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5">
          <p className="text-base font-medium leading-relaxed text-indigo-100 sm:text-lg">
            &ldquo;{targetText}&rdquo;
          </p>
          {hint && (
            <p className="mt-2 text-xs italic text-slate-400">
              💡 Tip: {hint}
            </p>
          )}
        </div>
      </div>

      {/* Errors display */}
      {(error || recorderError) && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <svg className="h-5 w-5 flex-shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error || recorderError}</p>
        </div>
      )}

      {/* Recording Studio Panel */}
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-slate-800 bg-slate-950/60 py-8 px-4 text-center">
        {/* Animated Waveform Visualizer */}
        <AudioWaveform
          analyserNode={analyserNode}
          isRecording={status === 'recording'}
          className="w-full max-w-md"
        />

        {/* Timer display */}
        <div className="flex items-center gap-2 text-sm font-mono font-semibold">
          {status === 'recording' && (
            <span className="flex h-2.5 w-2.5 animate-ping rounded-full bg-rose-500" />
          )}
          <span className={status === 'recording' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            {formatTime(duration)}
          </span>
          {status === 'recording' && (
            <span className="text-xs font-sans text-rose-400 uppercase tracking-widest font-bold">
              Recording...
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {status === 'idle' && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2.5 rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:scale-105 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start Recording
            </button>
          )}

          {status === 'recording' && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 hover:scale-105 active:scale-95"
            >
              <span className="h-3 w-3 rounded-sm bg-white" />
              Stop Recording
            </button>
          )}

          {status === 'stopped' && (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {audioUrl && (
                <audio controls src={audioUrl} className="h-10 rounded-lg max-w-xs" />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={resetRecording}
                  disabled={submitting}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  Re-record
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <span>Submit for Assessment</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {submitting && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
            <span>Evaluating Pronunciation, Fluency, Grammar, Vocabulary & Coherence...</span>
          </div>
        )}
      </div>
    </div>
  );
}
