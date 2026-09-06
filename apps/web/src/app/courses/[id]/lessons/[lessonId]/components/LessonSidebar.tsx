'use client';

interface LessonNavItem {
  id: string;
  title: string;
  lessonOrder: number;
}

interface LessonProgress {
  completed: boolean;
  progressPercentage: number;
}

interface LessonSidebarProps {
  courseId: string;
  currentLessonId: string;
  lessons: LessonNavItem[];
  progressMap?: Record<string, LessonProgress>;
}

export function LessonSidebar({
  courseId,
  currentLessonId,
  lessons,
  progressMap = {},
}: LessonSidebarProps) {
  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <aside className="flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700/40 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Course Progress
        </p>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {completedCount}/{lessons.length} lessons
          </span>
          <span className="font-semibold text-indigo-400">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lesson list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {lessons.map((lesson) => {
          const isCurrent = lesson.id === currentLessonId;
          const progress = progressMap[lesson.id];
          const isCompleted = progress?.completed ?? false;

          return (
            <a
              key={lesson.id}
              href={`/courses/${courseId}/lessons/${lesson.id}`}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                isCurrent
                  ? 'bg-indigo-500/10 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
              }`}
            >
              {/* Status icon */}
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                    : isCurrent
                      ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40'
                      : 'bg-slate-700/50 text-slate-500 ring-1 ring-slate-700/60'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  lesson.lessonOrder
                )}
              </span>

              {/* Title */}
              <span className="min-w-0 flex-1 leading-snug">
                <span className="line-clamp-2">{lesson.title}</span>
              </span>

              {/* Current indicator */}
              {isCurrent && (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
