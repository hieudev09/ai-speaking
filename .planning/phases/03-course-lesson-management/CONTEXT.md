# Phase 3: Course & Lesson Management — Context

**Status:** Completed
**Domain:** Courses catalog, Lesson content management (5 content types: TEXT, VIDEO, QUIZ, SPEAKING, VOCABULARY), Enrollment, and Progress tracking with automated percentage recalculation.

## Deliverables Completed:
1. **Courses API Module (`apps/api/src/modules/courses`)**:
   - `CreateCourseDto`, `UpdateCourseDto`, `CourseFilterDto` with `class-validator`
   - `GET /api/v1/courses` — Public paginated listing with category and level filters
   - `GET /api/v1/courses/:id` — Public course detail with ordered lesson syllabus
   - `POST /api/v1/courses` — Admin course creation with category relations
   - `PATCH /api/v1/courses/:id` — Admin course update
   - `POST /api/v1/courses/:id/enroll` — Authenticated course enrollment and progress initialization
   - `GET /api/v1/courses/:id/progress` — Authenticated course progress with per-lesson status
   - `recalculateCourseProgress()` helper for automatic progress rollups

2. **Lessons API Module (`apps/api/src/modules/lessons`)**:
   - `CreateLessonDto`, `UpdateLessonDto`, `CreateLessonContentDto`, `UpdateProgressDto`
   - `GET /api/v1/lessons/:id` — Public lesson viewer with sibling navigation & user progress
   - `POST /api/v1/lessons` — Admin lesson creation
   - `PATCH /api/v1/lessons/:id` — Admin lesson update
   - `POST /api/v1/lessons/:id/contents` — Admin content block attachment (JSONB)
   - `POST /api/v1/lessons/:id/progress` — Authenticated progress update & course progress recalculation
   - `GET /api/v1/lessons/:id/progress` — Authenticated lesson progress check

3. **Frontend API Client (`apps/web/src/lib/courses.ts`)**:
   - Typed client for fetching courses, course details, enrollment, and progress updates

4. **Frontend Course Pages (`apps/web/src/app`)**:
   - `/courses`: Course listing with level filter tabs, responsive cards, category badges, pagination, and empty states
   - `/courses/[id]`: Course detail with hero card, stats, dynamic metadata, lesson tree, and sticky enrollment CTA
   - `/courses/[id]/lessons/[lessonId]`: Interactive lesson viewer with dynamic breadcrumbs, sticky progress sidebar, sibling navigation, and "Mark as Complete" action

5. **Lesson Content Type Renderers**:
   - `TextContent`: Rich text styling with typography classes
   - `VideoContent`: YouTube embed & native HTML5 video player
   - `QuizContent`: Interactive question stepper with instant feedback and score summary
   - `VocabularyContent`: 3D flip card with pronunciation, phonetic guide, and translation
   - `SpeakingPlaceholder`: Voice practice placeholder ready for Phase 4
