# Phase 2: Authentication & User Management — Context

**Status:** Ready for Execution
**Domain:** Auth (JWT, OAuth, Guards, Tokens, Password Reset, Email Verification), User Management (Profile CRUD, Settings, Dashboard Metrics), Email Worker Integration.

## Phase Boundary
Deliverables for Phase 2:
1. **Prisma Service & Module** in `apps/api` for typed database access across modules.
2. **Auth Module (`apps/api/src/modules/auth`)**:
   - `RegisterDto`, `LoginDto`, `RefreshTokenDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `VerifyEmailDto`, `OAuthLoginDto` with `class-validator`
   - Password hashing and verification
   - JWT Access Token (15m) & Refresh Token (30d) generation with `@ai-platform/auth`
   - Refresh token rotation & revocation in `refresh_tokens` table
   - OAuth login stub / exchange (Google, Apple)
   - Email verification token generation & validation
   - Password reset token generation & validation
   - Session / device tracking (`user_devices`)
   - Rate limiting & security guards: `JwtAuthGuard`, `RolesGuard`, `PremiumGuard`, `@CurrentUser()`, `@Roles()`, `@Public()`
3. **User Management Module (`apps/api/src/modules/users`)**:
   - `GET /api/v1/users/me` — Current user info with profile and settings
   - `PUT /api/v1/users/me` — Update user profile (firstName, lastName, country, nativeLanguage, englishLevel, learningGoal)
   - `GET /api/v1/users/settings` — Get user settings
   - `PUT /api/v1/users/settings` — Update user settings (preferredLanguage, notificationEnabled, darkMode, timezone)
   - `GET /api/v1/users/dashboard` — Calculate user dashboard metrics (level, streaks, completed lessons, speaking minutes)
4. **Email Worker (`apps/workers`)**:
   - Connect `email.processor.ts` to log/process verification, password-reset, and welcome email jobs triggered by Auth Module via BullMQ `email_queue`.
5. **Auth Frontend Pages (`apps/web`)**:
   - Login page (`/login`)
   - Register page (`/register`)
   - Forgot password page (`/forgot-password`)
   - Reset password page (`/reset-password`)
   - Verify email page (`/verify-email`)
   - Auth client helper / API fetch wrapper
