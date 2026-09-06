'use client';

import { useState } from 'react';
import { updateLessonProgress } from '@/lib/courses';
import type { LessonContent } from '@/lib/courses';
import { TextContent } from './components/TextContent';
import { VideoContent } from './components/VideoContent';
import { QuizContent } from './components/QuizContent';
import { VocabularyContent } from './components/VocabularyContent';
import { SpeakingPracticeContent } from './components/SpeakingPracticeContent';

function ContentRenderer({
  block,
  lessonId,
  onPassed,
}: {
  block: LessonContent;
  lessonId: string;
  onPassed?: () => void;
}) {
  const { contentType, content } = block;

  switch (contentType) {
    case 'TEXT':
      return <TextContent content={content as any} />;
    case 'VIDEO':
      return <VideoContent content={content as any} />;
    case 'QUIZ':
      return <QuizContent content={content as any} />;
    case 'VOCABULARY':
      return <VocabularyContent content={content as any} />;
    case 'SPEAKING':
      return (
        <SpeakingPracticeContent
          content={content as any}
          lessonId={lessonId}
          onPassed={onPassed}
        />
      );
    default:
      return null;
  }
}

interface MarkCompleteButtonProps {
  lessonId: string;
  initialCompleted: boolean;
}

export function MarkCompleteButton({ lessonId, initialCompleted }: MarkCompleteButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function handleMark() {
    if (completed || loading) return;
    setLoading(true);
    try {
      await updateLessonProgress(lessonId, { completed: true, progressPercentage: 100 });
      setCompleted(true);
    } catch (err) {
      console.error('Failed to mark lesson as complete:', err);
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Lesson Completed
      </div>
    );
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Mark as Complete
        </>
      )}
    </button>
  );
}

interface LessonViewerClientProps {
  lessonId: string;
  contents: LessonContent[];
  isCompleted: boolean;
  currentIndex: number;
  totalLessons: number;
  courseId: string;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}

export function LessonViewerClient({
  lessonId,
  contents,
  isCompleted,
  currentIndex,
  totalLessons,
  courseId,
  prevLesson,
  nextLesson,
}: LessonViewerClientProps) {
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(currentIndex / totalLessons) * 100}%` }}
          />
        </div>
        <span className="flex-shrink-0 text-xs text-slate-500">
          {currentIndex}/{totalLessons} lessons
        </span>
      </div>

      {/* Content blocks */}
      {contents.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/20 py-16 text-center text-slate-500">
          No content available for this lesson yet.
        </div>
      ) : (
        <div className="space-y-6">
          {contents.map((block) => (
            <ContentRenderer
              key={block.id}
              block={block}
              lessonId={lessonId}
            />
          ))}
        </div>
      )}

      {/* Actions: Complete + Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/40 pt-6">
        <div className="flex flex-wrap gap-3">
          {prevLesson && (
            <a
              href={`/courses/${courseId}/lessons/${prevLesson.id}`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition-all hover:border-slate-500 hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </a>
          )}
          {nextLesson && (
            <a
              href={`/courses/${courseId}/lessons/${nextLesson.id}`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition-all hover:border-slate-500 hover:text-slate-200"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>

        <MarkCompleteButton lessonId={lessonId} initialCompleted={isCompleted} />
      </div>
    </div>
  );
}
