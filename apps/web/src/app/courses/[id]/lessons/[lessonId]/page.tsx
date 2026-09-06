import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLesson, getCourse } from '@/lib/courses';
import { LessonSidebar } from './components/LessonSidebar';
import { LessonViewerClient } from './LessonViewerClient';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  try {
    const lesson = await getLesson(lessonId);
    return {
      title: `${lesson.title} — Daily speaking with me (DSWM)`,
      description: lesson.description ?? `Learn with the ${lesson.title} lesson.`,
    };
  } catch {
    return { title: 'Lesson Not Found' };
  }
}

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonViewerPage({ params }: PageProps) {
  const { id: courseId, lessonId } = await params;

  let lesson: Awaited<ReturnType<typeof getLesson>> | null = null;
  let course: Awaited<ReturnType<typeof getCourse>> | null = null;

  try {
    [lesson, course] = await Promise.all([getLesson(lessonId), getCourse(courseId)]);
  } catch {
    notFound();
  }

  if (!lesson || !course) notFound();

  const { navigation, userProgress, contents } = lesson;
  const isCompleted = userProgress?.completed ?? false;

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-slate-300">Courses</Link>
          <span>/</span>
          <Link href={`/courses/${courseId}`} className="hover:text-slate-300">
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-slate-300">{lesson.title}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <LessonSidebar
                courseId={courseId}
                currentLessonId={lessonId}
                lessons={course.lessons.map((l) => ({
                  id: l.id,
                  title: l.title,
                  lessonOrder: l.lessonOrder,
                }))}
              />
            </div>
          </div>

          {/* Main viewer */}
          <div className="lg:col-span-3">
            {/* Lesson header */}
            <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/20">
                  Lesson {navigation.currentIndex} of {navigation.totalLessons}
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                  </span>
                )}
              </div>

              <h1 className="mb-2 text-2xl font-bold text-white">{lesson.title}</h1>

              {lesson.description && (
                <p className="text-sm text-slate-400 leading-relaxed">{lesson.description}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {lesson.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lesson.durationMinutes} min
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  {contents.length} content block{contents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Content viewer (client component for interactivity) */}
            <LessonViewerClient
              lessonId={lessonId}
              contents={contents}
              isCompleted={isCompleted}
              currentIndex={navigation.currentIndex}
              totalLessons={navigation.totalLessons}
              courseId={courseId}
              prevLesson={navigation.prev}
              nextLesson={navigation.next}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
