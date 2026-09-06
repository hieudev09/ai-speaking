import type { Metadata } from 'next';
import Link from 'next/link';
import { getCourses, type CourseSummary } from '@/lib/courses';

export const metadata: Metadata = {
  title: 'Courses — Daily speaking with me (DSWM)',
  description:
    'Browse our curated English speaking courses. Filter by level and topic. Beginner to Advanced.',
};

// Revalidate every 5 minutes
export const revalidate = 300;

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

function LevelBadge({ level }: { level: string }) {
  const cls = LEVEL_COLORS[level] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {level}
    </span>
  );
}

function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-indigo-500/10 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative h-44 w-full bg-gradient-to-br from-indigo-900/60 to-slate-900 overflow-hidden">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl opacity-40">📚</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <LevelBadge level={course.level} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Categories */}
        {course.categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {course.categories.slice(0, 2).map(({ category }) => (
              <span
                key={category.id}
                className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        <h3 className="mb-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-indigo-300">
          {course.title}
        </h3>

        {course.description && (
          <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-400">{course.description}</p>
        )}

        {/* Footer stats */}
        <div className="mt-auto flex items-center gap-4 border-t border-slate-700/40 pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {course._count.lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {course._count.enrollments.toLocaleString()} enrolled
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <h3 className="mb-2 text-lg font-semibold text-white">No courses found</h3>
      <p className="text-sm text-slate-400">
        {filter
          ? `No ${filter} courses available yet. Check back soon!`
          : 'No courses published yet. Check back soon!'}
      </p>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ level?: string; page?: string }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const level = params.level ?? '';
  const page = Number(params.page ?? 1);

  let result: Awaited<ReturnType<typeof getCourses>> | null = null;
  let error: string | null = null;

  try {
    result = await getCourses({ level: level || undefined, page, limit: 12 });
  } catch {
    error = 'Failed to load courses. Please try again later.';
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Learning Catalog
          </div>
          <h1 className="mb-3 text-4xl font-bold text-white">
            Explore Our{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Courses
            </span>
          </h1>
          <p className="max-w-2xl text-slate-400">
            Structured learning paths designed to take you from beginner to fluent English speaker
            with AI-powered feedback at every step.
          </p>
        </div>

        {/* Level Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/courses"
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              !level
                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            All Levels
          </Link>
          {LEVELS.map((lvl) => (
            <Link
              key={lvl}
              href={`/courses?level=${lvl}`}
              className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-all ${
                level === lvl
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {lvl}
            </Link>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Course Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result && result.data.length === 0 && <EmptyState filter={level} />}
          {result?.data.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}

          {/* Skeleton placeholders if loading is expected */}
          {!result && !error &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-slate-700/30 bg-slate-800/30"
              />
            ))}
        </div>

        {/* Pagination */}
        {result && result.meta.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/courses?${level ? `level=${level}&` : ''}page=${page - 1}`}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-all hover:border-slate-500 hover:text-white"
              >
                ← Previous
              </Link>
            )}
            <span className="px-3 text-sm text-slate-500">
              Page {page} of {result.meta.totalPages}
            </span>
            {page < result.meta.totalPages && (
              <Link
                href={`/courses?${level ? `level=${level}&` : ''}page=${page + 1}`}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-all hover:border-slate-500 hover:text-white"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
