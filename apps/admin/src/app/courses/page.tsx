'use client';

import { useState, useEffect } from 'react';
import { fetchAdminCourses } from '../../lib/api';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchAdminCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Curriculum & Lesson Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize structured learning paths, multimedia content, and speaking practice modules.
          </p>
        </div>

        <button
          onClick={() => alert('Course authoring dialog')}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Create New Course</span>
        </button>
      </div>

      {/* Course List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No courses found in database
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-white">{course.title}</h2>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      {course.status || 'published'}
                    </span>
                    <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold capitalize">
                      {course.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                  <div>
                    Enrolled: <strong className="text-white">{course._count?.enrollments ?? 0}</strong>
                  </div>
                  <div>
                    Lessons: <strong className="text-white">{course.lessons?.length ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Lesson Hierarchy */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Lesson Modules
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {course.lessons?.map((l: any, idx: number) => (
                    <div
                      key={l.id || idx}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-xs"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-700 font-bold text-[11px] text-white">
                        {l.lessonOrder || idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate flex-1">
                        {l.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
