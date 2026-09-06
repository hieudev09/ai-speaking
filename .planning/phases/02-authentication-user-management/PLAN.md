# Phase 2: Authentication & User Management — Execution Plan

**Phase:** 2 — Authentication & User Management
**Status:** IN PROGRESS

---

## Tasks Breakdown

### Wave 1: Database & Shared Services in API
- **Task 2.1.1**: Create `PrismaService` & `PrismaModule` in `apps/api` (`src/prisma/prisma.service.ts`, `src/prisma/prisma.module.ts`).
- **Task 2.1.2**: Update `@ai-platform/auth` package if needed with password hashing helper (or scrypt/argon2 utils).

### Wave 2: Auth Module Backend (`apps/api/src/modules/auth`)
- **Task 2.2.1**: Create DTOs (`dto/register.dto.ts`, `dto/login.dto.ts`, `dto/refresh.dto.ts`, `dto/forgot-password.dto.ts`, `dto/reset-password.dto.ts`, `dto/verify-email.dto.ts`, `dto/oauth.dto.ts`).
- **Task 2.2.2**: Create Decorators & Guards (`guards/jwt-auth.guard.ts`, `guards/roles.guard.ts`, `guards/premium.guard.ts`, `decorators/current-user.decorator.ts`, `decorators/roles.decorator.ts`, `decorators/public.decorator.ts`).
- **Task 2.2.3**: Create `AuthService` (`auth.service.ts`) with register, login, refresh rotation, logout, email verify, forgot/reset password, OAuth handlers.
- **Task 2.2.4**: Create `AuthController` (`auth.controller.ts`) with endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `POST /api/v1/auth/google`
  - `POST /api/v1/auth/apple`
- **Task 2.2.5**: Update `AuthModule` (`auth.module.ts`) with BullMQ `email_queue` client registration.

### Wave 3: User Management Backend (`apps/api/src/modules/users`)
- **Task 2.3.1**: Create User DTOs (`dto/update-profile.dto.ts`, `dto/update-settings.dto.ts`).
- **Task 2.3.2**: Create `UsersService` (`users.service.ts`) with profile CRUD, settings CRUD, dashboard metrics.
- **Task 2.3.3**: Create `UsersController` (`users.controller.ts`) with endpoints:
  - `GET /api/v1/users/me`
  - `PUT /api/v1/users/me`
  - `GET /api/v1/users/settings`
  - `PUT /api/v1/users/settings`
  - `GET /api/v1/users/dashboard`
- **Task 2.3.4**: Update `UsersModule` (`users.module.ts`).

### Wave 4: Worker Email Processing (`apps/workers`)
- **Task 2.4.1**: Enhance `apps/workers/src/processors/email.processor.ts` to support email templates (`email_verification`, `password_reset`, `welcome`).

### Wave 5: Auth Frontend in Web App (`apps/web`)
- **Task 2.5.1**: Create Auth API client (`apps/web/src/lib/api.ts`, `apps/web/src/lib/auth.ts`).
- **Task 2.5.2**: Create Register page (`apps/web/src/app/(auth)/register/page.tsx`).
- **Task 2.5.3**: Create Login page (`apps/web/src/app/(auth)/login/page.tsx`).
- **Task 2.5.4**: Create Forgot Password page (`apps/web/src/app/(auth)/forgot-password/page.tsx`).
- **Task 2.5.5**: Create Reset Password page (`apps/web/src/app/(auth)/reset-password/page.tsx`).
- **Task 2.5.6**: Create Verify Email page (`apps/web/src/app/(auth)/verify-email/page.tsx`).

### Wave 6: Verification & Testing
- **Task 2.6.1**: Run `pnpm typecheck` and `pnpm build` across all packages and apps.
- **Task 2.6.2**: Test auth and user management endpoints.
