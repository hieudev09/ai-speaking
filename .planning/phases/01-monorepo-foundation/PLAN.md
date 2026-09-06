# Phase 1: Monorepo Foundation & Infrastructure — Execution Plan

**Phase:** 1 — Monorepo Foundation & Infrastructure
**Status:** PLANNED
**Created:** 2026-08-29
**Estimated Tasks:** 28 tasks across 5 waves

---

## Pre-Execution Checklist

Before running `/gsd:execute-phase 1`, verify:
- [ ] Node.js >= 18 installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Docker + Docker Compose installed (`docker --version`)
- [ ] Git initialized at `/home/alex/ai-speaking` ✅ (already done)

---

## Wave Structure

```
Wave 1 — Root Monorepo Scaffold (turbo, pnpm, root package.json, .env)
Wave 2 — Shared Packages (types, config, utils, logger, auth, ui)
Wave 3 — App Scaffolding (web, api, workers, admin, ai-gateway)
Wave 4 — Database (packages/prisma: schema.prisma + migrations + seed)
Wave 5 — Docker, CI/CD, Quality Tooling (docker-compose, husky, GitHub Actions)
```

Waves 1–2 must complete before Wave 3. Wave 4 can run in parallel with Wave 3. Wave 5 runs last.

---

## Wave 1: Root Monorepo Scaffold

### Task 1.1 — Initialize Root package.json
**Type:** file
**File:** `package.json` (root)

```json
{
  "name": "ai-english-platform",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:generate": "turbo run db:generate",
    "db:migrate": "pnpm --filter @ai-platform/prisma db:migrate",
    "db:seed": "pnpm --filter @ai-platform/prisma db:seed",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**Verification:** `cat package.json | grep turbo`

---

### Task 1.2 — Create pnpm-workspace.yaml
**Type:** file
**File:** `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Verification:** `pnpm list --filter "@ai-platform/*" 2>&1 | head -5`

---

### Task 1.3 — Create turbo.json
**Type:** file
**File:** `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    },
    "db:generate": {
      "outputs": ["packages/prisma/generated/**"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

**Verification:** `cat turbo.json | grep schema`

---

### Task 1.4 — Create Root tsconfig.base.json
**Type:** file
**File:** `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Verification:** `cat tsconfig.base.json | grep strict`

---

### Task 1.5 — Create .env.example
**Type:** file
**File:** `.env.example`

```env
# === DATABASE ===
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_speaking_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ai_speaking_db?schema=public"

# === REDIS ===
REDIS_URL="redis://localhost:6379"

# === JWT ===
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-min-32-chars"
REFRESH_TOKEN_EXPIRES_IN="30d"

# === AI PROVIDERS ===
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# === FILE STORAGE ===
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET=""
# OR use Cloudflare R2:
# R2_ACCOUNT_ID=""
# R2_ACCESS_KEY_ID=""
# R2_SECRET_ACCESS_KEY=""
# R2_BUCKET=""

# === EMAIL ===
SENDGRID_API_KEY=""
EMAIL_FROM="noreply@ai-speaking.com"

# === OAUTH ===
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_PRIVATE_KEY=""

# === PAYMENT (Stripe) ===
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# === APP CONFIG ===
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3002"
AI_GATEWAY_URL="http://localhost:3003"

# === MONITORING ===
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
```

**Verification:** `wc -l .env.example`

---

### Task 1.6 — Create .gitignore
**Type:** file
**File:** `.gitignore`

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
.turbo/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Database
packages/prisma/generated/

# Logs
*.log
logs/

# Editor
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Docker volumes
postgres_data/
redis_data/
```

**Verification:** `cat .gitignore | grep node_modules`

---

## Wave 2: Shared Packages

### Task 2.1 — Create packages/types
**Type:** package
**Dir:** `packages/types/`

**package.json:**
```json
{
  "name": "@ai-platform/types",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": { "typescript": "^5.4.0" }
}
```

**src/index.ts** — exports all types:
- `UserRole` enum: GUEST, USER, PREMIUM, ADMIN, SUPER_ADMIN
- `UserStatus` enum: ACTIVE, INACTIVE, SUSPENDED
- `ConversationStatus` enum: ACTIVE, ENDED
- `SenderType` enum: USER, AI, SYSTEM
- `AIProvider` enum: OPENAI, CLAUDE, GEMINI
- `LessonContentType` enum: TEXT, VIDEO, QUIZ, SPEAKING, VOCABULARY
- `SubscriptionStatus` enum: ACTIVE, EXPIRED, CANCELLED
- `PaymentStatus` enum: PENDING, COMPLETED, FAILED, REFUNDED
- `QueueName` enum: EMAIL, SPEECH, ASSESSMENT, ANALYTICS, NOTIFICATION
- `ASSESSMENT_WEIGHTS` const: `{ pronunciation: 0.25, fluency: 0.20, grammar: 0.20, vocabulary: 0.20, coherence: 0.15 }`
- `CACHE_TTL` const: `{ PROFILE: 3600, LESSON: 21600, AI_RESPONSE: 86400 }`
- `CACHE_KEYS` helper functions: `userKey(id)`, `lessonKey(id)`, `conversationKey(id)`, `aiResponseKey(hash)`
- `UserDto`, `CourseDto`, `LessonDto`, `AssessmentDto`, `ConversationDto` interfaces
- `PaginationDto`, `ApiResponse<T>` generic types

**tsconfig.json:** extends `../../tsconfig.base.json`

**Verification:** `pnpm --filter @ai-platform/types build && ls packages/types/dist/`

---

### Task 2.2 — Create packages/config
**Type:** package
**Dir:** `packages/config/`

**Contents:**
- `eslint-base.js` — @typescript-eslint/recommended + import plugin + prettier compat
- `eslint-nextjs.js` — extends base + next/core-web-vitals
- `eslint-nestjs.js` — extends base + no-console rule
- `prettier.config.js` — singleQuote, trailingComma: 'all', tabWidth: 2, printWidth: 100
- `tsconfig.base.json` — re-exports root tsconfig.base.json
- `tsconfig.nextjs.json` — extends base + jsx preserve + next plugin
- `tsconfig.nestjs.json` — extends base + experimentalDecorators + emitDecoratorMetadata

**package.json:**
```json
{ "name": "@ai-platform/config", "version": "0.1.0", "private": true }
```

**Verification:** `ls packages/config/`

---

### Task 2.3 — Create packages/logger
**Type:** package
**Dir:** `packages/logger/`

**Dependencies:** pino, pino-pretty (devDep)

**src/index.ts:**
```typescript
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: { service: process.env.SERVICE_NAME || 'ai-platform' },
});

export type Logger = typeof logger;
export const createLogger = (context: string) => logger.child({ context });
```

**Verification:** `pnpm --filter @ai-platform/logger build`

---

### Task 2.4 — Create packages/utils
**Type:** package
**Dir:** `packages/utils/`

**src/index.ts** — exports:
- `formatDate(date: Date, format?: string): string`
- `slugify(text: string): string`
- `generateId(): string` (uses crypto.randomUUID)
- `calculateAssessmentScore(scores: AssessmentScores): number` (using ASSESSMENT_WEIGHTS)
- `paginate<T>(items: T[], page: number, limit: number): PaginatedResult<T>`
- `sanitizeHtml(input: string): string`
- `isValidEmail(email: string): boolean`
- `maskEmail(email: string): string` (for logs)
- `sleep(ms: number): Promise<void>`

**Verification:** `pnpm --filter @ai-platform/utils build`

---

### Task 2.5 — Create packages/auth
**Type:** package
**Dir:** `packages/auth/`

**Dependencies:** jsonwebtoken, @types/jsonwebtoken

**src/index.ts** — exports:
- `JwtPayload` interface: `{ sub: string; email: string; role: UserRole; iat?: number; exp?: number }`
- `signToken(payload: JwtPayload, secret: string, expiresIn: string): string`
- `verifyToken(token: string, secret: string): JwtPayload`
- `generateRefreshToken(): string` (crypto.randomBytes(64).toString('hex'))
- `PERMISSIONS` map: role → allowed actions
- `hasPermission(role: UserRole, action: string): boolean`

**Verification:** `pnpm --filter @ai-platform/auth build`

---

### Task 2.6 — Create packages/ai-sdk (stub)
**Type:** package
**Dir:** `packages/ai-sdk/`

**src/index.ts** — provider stubs (Phase 5 will implement):
```typescript
export interface AIMessage { role: 'user' | 'assistant' | 'system'; content: string; }
export interface AIResponse { content: string; tokensUsed: number; model: string; provider: string; }
export interface AIProvider { complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse>; }

// Stub providers — throw NotImplementedError until Phase 5
export class OpenAIProvider implements AIProvider { ... }
export class ClaudeProvider implements AIProvider { ... }
export class GeminiProvider implements AIProvider { ... }
export class AIRouter { route(task: AITask): Promise<AIResponse> { ... } }
export type AITask = 'grammar' | 'pronunciation' | 'long-context' | 'quick-chat' | 'ielts';
```

**Verification:** `pnpm --filter @ai-platform/ai-sdk build`

---

### Task 2.7 — Create packages/ui (minimal stubs)
**Type:** package
**Dir:** `packages/ui/`

**Framework:** React + TailwindCSS

**src/index.ts** — exports stub components:
- `Button` — with variant (primary/secondary/ghost) and size (sm/md/lg) props
- `Card` — with optional header/footer
- `Input` — with label, error, helper text
- `Badge` — for score display, status indicators
- `Spinner` — loading indicator
- `Avatar` — user avatar with fallback initials

These are minimal production-quality components (not placeholders) that apps/web and apps/admin can use.

**Verification:** `pnpm --filter @ai-platform/ui build`

---

## Wave 3: App Scaffolding

### Task 3.1 — Scaffold apps/web (NextJS 15)
**Type:** app-scaffold
**Dir:** `apps/web/`
**Command:** `cd apps/web && npx -y create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git`

**Post-scaffold:**
- Update `package.json` name to `@ai-platform/web`
- Add workspace dependencies: `@ai-platform/types`, `@ai-platform/ui`, `@ai-platform/utils`
- Create `src/app/page.tsx` — minimal landing "AI Speaking Platform — Coming Soon" (styled with TailwindCSS)
- Create `src/app/layout.tsx` — root layout with Inter font
- Create `src/app/(auth)/layout.tsx` — auth group layout stub
- Create `src/app/dashboard/layout.tsx` — dashboard layout stub

**Verification:** `pnpm --filter @ai-platform/web typecheck`

---

### Task 3.2 — Scaffold apps/api (NestJS)
**Type:** app-scaffold
**Dir:** `apps/api/`
**Command:** `cd apps/api && npx -y @nestjs/cli@latest new . --package-manager pnpm --skip-install --language TypeScript`

**Post-scaffold:**
- Update `package.json` name to `@ai-platform/api`
- Add workspace deps: `@ai-platform/types`, `@ai-platform/logger`, `@ai-platform/utils`, `@ai-platform/auth`, `@ai-platform/prisma` (stub)
- Create module stubs (empty modules, no logic): auth, users, courses, lessons, conversations, assessments, subscriptions, payments, analytics, notifications, admin, ai
- Create `src/app.module.ts` — imports all stubs
- Create `src/main.ts` — NestJS bootstrap with Helmet, CORS, GlobalPipes, ValidationPipe
- Set port from `process.env.PORT` (default 3001)

**Verification:** `pnpm --filter @ai-platform/api typecheck`

---

### Task 3.3 — Scaffold apps/workers (NestJS + BullMQ)
**Type:** app-scaffold
**Dir:** `apps/workers/`

**Dependencies:** @nestjs/bullmq, bullmq, ioredis

**Structure:**
```
apps/workers/src/
├── main.ts
├── workers.module.ts
└── processors/
    ├── email.processor.ts (stub)
    ├── speech.processor.ts (stub)
    ├── assessment.processor.ts (stub)
    ├── analytics.processor.ts (stub)
    └── notification.processor.ts (stub)
```

**Each processor stub:**
```typescript
@Processor(QueueName.SPEECH)
export class SpeechProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job ${job.id} — implementation in Phase 4`);
  }
}
```

**Verification:** `pnpm --filter @ai-platform/workers typecheck`

---

### Task 3.4 — Scaffold apps/admin (NextJS)
**Type:** app-scaffold
**Dir:** `apps/admin/`
**Command:** `cd apps/admin && npx -y create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git`

**Post-scaffold:**
- Update name to `@ai-platform/admin`, port 3002
- Add workspace deps: `@ai-platform/types`, `@ai-platform/ui`, `@ai-platform/utils`
- Create placeholder admin dashboard page
- Configure next.config.ts: `basePath: ''`, `port: 3002`

**Verification:** `pnpm --filter @ai-platform/admin typecheck`

---

### Task 3.5 — Scaffold apps/ai-gateway (NestJS)
**Type:** app-scaffold
**Dir:** `apps/ai-gateway/`

**Purpose:** Standalone NestJS service that wraps OpenAI, Claude, Gemini APIs (stub in Phase 1, implemented in Phase 5)

**Structure:**
```
apps/ai-gateway/src/
├── main.ts (port 3003)
├── gateway.module.ts
├── router/
│   ├── ai-router.service.ts (stub)
│   └── routing-matrix.ts (LOCKED routing decisions from 05-AI-ARCHITECTURE.md)
└── providers/
    ├── openai.provider.ts (stub)
    ├── claude.provider.ts (stub)
    └── gemini.provider.ts (stub)
```

**routing-matrix.ts** — codify the locked routing matrix from 05-AI-ARCHITECTURE.md:
```typescript
export const ROUTING_MATRIX: Record<AITask, AIProvider> = {
  'grammar-correction': AIProvider.OPENAI,
  'pronunciation-feedback': AIProvider.OPENAI,
  'knowledge-search': AIProvider.OPENAI,
  'long-conversation': AIProvider.CLAUDE,
  'study-plan': AIProvider.CLAUDE,
  'ielts-feedback': AIProvider.CLAUDE,
  'quick-chat': AIProvider.GEMINI,
  'daily-practice': AIProvider.GEMINI,
};

export const FALLBACK_CHAIN = [AIProvider.OPENAI, AIProvider.CLAUDE, AIProvider.GEMINI];
```

**Verification:** `pnpm --filter @ai-platform/ai-gateway typecheck`

---

## Wave 4: Database (packages/prisma)

### Task 4.1 — Create packages/prisma package
**Type:** package
**Dir:** `packages/prisma/`

**package.json:**
```json
{
  "name": "@ai-platform/prisma",
  "version": "0.1.0",
  "main": "./generated/client/index.js",
  "types": "./generated/client/index.d.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force"
  },
  "dependencies": { "@prisma/client": "^5.14.0" },
  "devDependencies": { "prisma": "^5.14.0", "tsx": "^4.0.0" }
}
```

---

### Task 4.2 — Create schema.prisma (all 30 tables)
**Type:** file
**File:** `packages/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ==================== AUTH DOMAIN ====================

model User {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email          String    @unique @db.VarChar(255)
  passwordHash   String?   @map("password_hash") @db.Text
  role           String    @default("user") @db.VarChar(50)
  status         String    @default("active") @db.VarChar(50)
  emailVerified  Boolean   @default(false) @map("email_verified")
  lastLoginAt    DateTime? @map("last_login_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  profile          UserProfile?
  settings         UserSettings?
  devices          UserDevice[]
  refreshTokens    RefreshToken[]
  conversations    Conversation[]
  assessments      Assessment[]
  enrollments      Enrollment[]
  subscriptions    UserSubscription[]
  achievements     UserAchievement[]
  notifications    Notification[]
  analyticsEvents  AnalyticsEvent[]
  aiRequests       AiRequest[]
  streak           UserStreak?
  retrievalLogs    RetrievalLog[]
  payments         Payment[]

  @@index([email], name: "idx_users_email")
  @@index([role], name: "idx_users_role")
  @@index([status], name: "idx_users_status")
  @@map("users")
}

model UserProfile {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String   @unique @map("user_id") @db.Uuid
  firstName      String?  @map("first_name") @db.VarChar(100)
  lastName       String?  @map("last_name") @db.VarChar(100)
  avatarUrl      String?  @map("avatar_url") @db.Text
  birthDate      DateTime? @map("birth_date") @db.Date
  country        String?  @db.VarChar(100)
  nativeLanguage String?  @map("native_language") @db.VarChar(50)
  englishLevel   String?  @map("english_level") @db.VarChar(50)
  learningGoal   String?  @map("learning_goal") @db.VarChar(255)
  createdAt      DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserSettings {
  id                   String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId               String  @unique @map("user_id") @db.Uuid
  preferredLanguage    String  @default("en") @map("preferred_language") @db.VarChar(10)
  notificationEnabled  Boolean @default(true) @map("notification_enabled")
  darkMode             Boolean @default(false) @map("dark_mode")
  timezone             String  @default("UTC") @db.VarChar(50)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model UserDevice {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  deviceName   String?   @map("device_name") @db.VarChar(255)
  deviceType   String?   @map("device_type") @db.VarChar(50)
  ipAddress    String?   @map("ip_address") @db.VarChar(50)
  lastActiveAt DateTime? @map("last_active_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_devices")
}

model RefreshToken {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @db.Text
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("refresh_tokens")
}

// ==================== COURSE DOMAIN ====================

model Course {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title        String   @db.VarChar(255)
  slug         String   @unique @db.VarChar(255)
  description  String?  @db.Text
  thumbnailUrl String?  @map("thumbnail_url") @db.Text
  level        String   @default("beginner") @db.VarChar(50)
  status       String   @default("draft") @db.VarChar(50)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  lessons     Lesson[]
  enrollments Enrollment[]
  categories  CourseCategoryRelation[]
  progress    CourseProgress[]

  @@map("courses")
}

model CourseCategory {
  id      String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name    String @db.VarChar(100)
  slug    String @unique @db.VarChar(100)
  courses CourseCategoryRelation[]

  @@map("course_categories")
}

model CourseCategoryRelation {
  courseId   String @map("course_id") @db.Uuid
  categoryId String @map("category_id") @db.Uuid

  course   Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  category CourseCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([courseId, categoryId])
  @@map("course_category_relations")
}

model Lesson {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId        String   @map("course_id") @db.Uuid
  title           String   @db.VarChar(255)
  description     String?  @db.Text
  lessonOrder     Int      @map("lesson_order")
  durationMinutes Int?     @map("duration_minutes")
  createdAt       DateTime @default(now()) @map("created_at")

  course   Course          @relation(fields: [courseId], references: [id], onDelete: Cascade)
  contents LessonContent[]
  progress LessonProgress[]

  @@map("lessons")
}

model LessonContent {
  id          String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lessonId    String @map("lesson_id") @db.Uuid
  contentType String @map("content_type") @db.VarChar(50)
  content     Json   @db.JsonB

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@map("lesson_contents")
}

// ==================== ENROLLMENT DOMAIN ====================

model Enrollment {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  courseId   String   @map("course_id") @db.Uuid
  enrolledAt DateTime @default(now()) @map("enrolled_at")

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@map("enrollments")
}

model LessonProgress {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String    @map("user_id") @db.Uuid
  lessonId           String    @map("lesson_id") @db.Uuid
  completed          Boolean   @default(false)
  completedAt        DateTime? @map("completed_at")
  progressPercentage Int       @default(0) @map("progress_percentage")

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@map("lesson_progress")
}

model CourseProgress {
  id                   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId               String @map("user_id") @db.Uuid
  courseId             String @map("course_id") @db.Uuid
  completedLessons     Int    @default(0) @map("completed_lessons")
  completionPercentage Int    @default(0) @map("completion_percentage")

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@map("course_progress")
}

// ==================== CONVERSATION DOMAIN ====================

model Conversation {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String?  @db.VarChar(255)
  topic     String?  @db.VarChar(255)
  aiRole    String?  @map("ai_role") @db.VarChar(100)
  status    String   @default("active") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user        User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    ConversationMessage[]
  contexts    ConversationContext[]
  audioFiles  AudioFile[]
  assessments Assessment[]

  @@index([userId])
  @@map("conversations")
}

model ConversationMessage {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  senderType     String   @map("sender_type") @db.VarChar(20)
  message        String   @db.Text
  tokenUsage     Int?     @map("token_usage")
  modelName      String?  @map("model_name") @db.VarChar(100)
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("conversation_messages")
}

model ConversationContext {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  contextJson    Json     @map("context_json") @db.JsonB
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("conversation_contexts")
}

// ==================== AUDIO DOMAIN ====================

model AudioFile {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  conversationId String?  @map("conversation_id") @db.Uuid
  fileUrl        String   @map("file_url") @db.Text
  fileSize       BigInt?  @map("file_size")
  durationSeconds Int?    @map("duration_seconds")
  mimeType       String?  @map("mime_type") @db.VarChar(100)
  createdAt      DateTime @default(now()) @map("created_at")

  conversation Conversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  transcripts  Transcript[]

  @@map("audio_files")
}

model Transcript {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  audioFileId    String   @map("audio_file_id") @db.Uuid
  transcriptText String   @map("transcript_text") @db.Text
  language       String   @default("en") @db.VarChar(10)
  createdAt      DateTime @default(now()) @map("created_at")

  audioFile AudioFile @relation(fields: [audioFileId], references: [id], onDelete: Cascade)

  @@map("transcripts")
}

// ==================== ASSESSMENT DOMAIN ====================

model Assessment {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  conversationId String?  @map("conversation_id") @db.Uuid
  overallScore   Decimal? @map("overall_score") @db.Decimal(5, 2)
  createdAt      DateTime @default(now()) @map("created_at")

  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  conversation Conversation?       @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  details      AssessmentDetail?
  feedbacks    AssessmentFeedback?
  errors       PronunciationError[]

  @@index([userId])
  @@map("assessments")
}

model AssessmentDetail {
  id                String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assessmentId      String  @unique @map("assessment_id") @db.Uuid
  pronunciationScore Decimal? @map("pronunciation_score") @db.Decimal(5, 2)
  fluencyScore       Decimal? @map("fluency_score") @db.Decimal(5, 2)
  grammarScore       Decimal? @map("grammar_score") @db.Decimal(5, 2)
  vocabularyScore    Decimal? @map("vocabulary_score") @db.Decimal(5, 2)
  coherenceScore     Decimal? @map("coherence_score") @db.Decimal(5, 2)

  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@map("assessment_details")
}

model AssessmentFeedback {
  id            String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assessmentId  String @unique @map("assessment_id") @db.Uuid
  strengths     String? @db.Text
  weaknesses    String? @db.Text
  recommendations String? @db.Text

  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@map("assessment_feedbacks")
}

model PronunciationError {
  id                    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assessmentId          String @map("assessment_id") @db.Uuid
  word                  String @db.VarChar(100)
  expectedPronunciation String? @map("expected_pronunciation") @db.VarChar(255)
  actualPronunciation   String? @map("actual_pronunciation") @db.VarChar(255)
  severity              String @default("low") @db.VarChar(20)

  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@map("pronunciation_errors")
}

// ==================== AI DOMAIN ====================

model AiModel {
  id        String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider  String @db.VarChar(50)
  modelName String @map("model_name") @db.VarChar(100)
  active    Boolean @default(true)
  requests  AiRequest[]

  @@map("ai_models")
}

model AiRequest {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  modelId          String?  @map("model_id") @db.Uuid
  promptTokens     Int?     @map("prompt_tokens")
  completionTokens Int?     @map("completion_tokens")
  totalTokens      Int?     @map("total_tokens")
  cost             Decimal? @db.Decimal(10, 6)
  latencyMs        Int?     @map("latency_ms")
  createdAt        DateTime @default(now()) @map("created_at")

  user  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  model AiModel? @relation(fields: [modelId], references: [id], onDelete: SetNull)

  @@map("ai_requests")
}

model AiPromptTemplate {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(100)
  templateContent String   @map("template_content") @db.Text
  version         Int      @default(1)
  active          Boolean  @default(true)
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([name, version])
  @@map("ai_prompt_templates")
}

// ==================== RAG DOMAIN ====================

model KnowledgeDocument {
  id       String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title    String @db.VarChar(255)
  content  String @db.Text
  category String @db.VarChar(100)
  source   String? @db.VarChar(255)
  chunks   DocumentChunk[]

  @@map("knowledge_documents")
}

model DocumentChunk {
  id           String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  documentId   String @map("document_id") @db.Uuid
  chunkContent String @map("chunk_content") @db.Text
  chunkOrder   Int    @map("chunk_order")
  embedding    DocumentEmbedding?

  document KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@map("document_chunks")
}

model DocumentEmbedding {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  chunkId   String   @unique @map("chunk_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  // Note: embedding vector stored as Unsupported until prisma supports pgvector natively
  // Use raw SQL for vector operations: SELECT * FROM document_embeddings ORDER BY embedding <-> $1 LIMIT 10

  chunk DocumentChunk @relation(fields: [chunkId], references: [id], onDelete: Cascade)

  @@map("document_embeddings")
}

model RetrievalLog {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId              String   @map("user_id") @db.Uuid
  queryText           String   @map("query_text") @db.Text
  retrievedDocuments  Json     @map("retrieved_documents") @db.JsonB
  createdAt           DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("retrieval_logs")
}

// ==================== SUBSCRIPTION DOMAIN ====================

model SubscriptionPlan {
  id            String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String @unique @db.VarChar(100)
  price         Decimal @db.Decimal(10, 2)
  durationDays  Int    @map("duration_days")
  aiUsageLimit  Int    @default(-1) @map("ai_usage_limit") // -1 = unlimited
  features      Json?  @db.JsonB
  subscriptions UserSubscription[]

  @@map("subscription_plans")
}

model UserSubscription {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  planId    String   @map("plan_id") @db.Uuid
  startDate DateTime @map("start_date")
  endDate   DateTime @map("end_date")
  status    String   @default("active") @db.VarChar(50)

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan     SubscriptionPlan @relation(fields: [planId], references: [id])
  payments Payment[]

  @@map("user_subscriptions")
}

// ==================== PAYMENT DOMAIN ====================

model Payment {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  subscriptionId  String?  @map("subscription_id") @db.Uuid
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD") @db.VarChar(10)
  paymentProvider String   @map("payment_provider") @db.VarChar(50)
  paymentStatus   String   @map("payment_status") @db.VarChar(50)
  externalId      String?  @map("external_id") @db.VarChar(255)
  createdAt       DateTime @default(now()) @map("created_at")

  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription UserSubscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)
  invoice      Invoice?

  @@map("payments")
}

model Invoice {
  id            String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  paymentId     String @unique @map("payment_id") @db.Uuid
  invoiceNumber String @unique @map("invoice_number") @db.VarChar(50)
  invoiceUrl    String? @map("invoice_url") @db.Text
  createdAt     DateTime @default(now()) @map("created_at")

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@map("invoices")
}

// ==================== GAMIFICATION DOMAIN ====================

model Achievement {
  id          String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String @db.VarChar(255)
  description String? @db.Text
  iconUrl     String? @map("icon_url") @db.Text
  condition   Json?   @db.JsonB // trigger conditions
  userAchievements UserAchievement[]

  @@map("achievements")
}

model UserAchievement {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  achievementId String   @map("achievement_id") @db.Uuid
  unlockedAt    DateTime @default(now()) @map("unlocked_at")

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@map("user_achievements")
}

model UserStreak {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @unique @map("user_id") @db.Uuid
  currentStreak Int      @default(0) @map("current_streak")
  longestStreak Int      @default(0) @map("longest_streak")
  lastActivityDate DateTime? @map("last_activity_date") @db.Date
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_streaks")
}

// ==================== NOTIFICATION DOMAIN ====================

model Notification {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String   @db.VarChar(255)
  message   String   @db.Text
  isRead    Boolean  @default(false) @map("is_read")
  type      String?  @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model NotificationTemplate {
  id        String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String @unique @db.VarChar(100)
  channel   String @db.VarChar(50)
  subject   String? @db.VarChar(255)
  content   String @db.Text

  @@map("notification_templates")
}

// ==================== ANALYTICS DOMAIN ====================

model AnalyticsEvent {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  eventName String   @map("event_name") @db.VarChar(100)
  eventData Json?    @map("event_data") @db.JsonB
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([eventName])
  @@index([userId])
  @@map("analytics_events")
}

model DailyStatistic {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date                DateTime @unique @db.Date
  activeUsers         Int      @default(0) @map("active_users")
  newUsers            Int      @default(0) @map("new_users")
  totalConversations  Int      @default(0) @map("total_conversations")
  totalAssessments    Int      @default(0) @map("total_assessments")
  totalAiRequests     Int      @default(0) @map("total_ai_requests")

  @@map("daily_statistics")
}

// ==================== ADMIN DOMAIN ====================

model AdminAuditLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  adminId    String   @map("admin_id") @db.Uuid
  action     String   @db.VarChar(100)
  targetType String?  @map("target_type") @db.VarChar(50)
  targetId   String?  @map("target_id") @db.Uuid
  metadata   Json?    @db.JsonB
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([adminId])
  @@index([createdAt])
  @@map("admin_audit_logs")
}
```

**Verification:** `pnpm --filter @ai-platform/prisma db:generate && echo "Schema valid"`

---

### Task 4.3 — Create PostgreSQL setup migration
**Type:** file
**File:** `packages/prisma/migrations/0000_setup_extensions/migration.sql`

```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add vector column to document_embeddings (pgvector raw SQL)
ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector ON document_embeddings USING ivfflat (embedding_vector vector_cosine_ops);
```

---

### Task 4.4 — Create seed.ts
**Type:** file
**File:** `packages/prisma/seed.ts`

Seeds:
1. Default subscription plans: Free (price: 0, limit: 10), Premium Monthly ($9.99, unlimited), Premium Yearly ($79, unlimited)
2. Default admin user: admin@ai-speaking.com (role: admin)
3. AI models: GPT-5, Claude Sonnet, Gemini Pro (all active)
4. Default prompt templates: conversation_teacher v1, conversation_interviewer v1, grammar_checker v1, pronunciation_feedback v1, ielts_examiner v1
5. Default achievements: First Conversation, 7-Day Streak, 30-Day Streak, 100 Conversations, 1000 Minutes Speaking
6. Sample course: "English Basics" (Beginner, 3 lessons) with sample content

**Verification:** `pnpm db:seed && echo "Seed successful"`

---

## Wave 5: Docker, CI/CD, Quality Tooling

### Task 5.1 — Create docker-compose.yml
**Type:** file
**File:** `docker-compose.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: ai_speaking_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_speaking_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai_speaking_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Note:** Use `pgvector/pgvector:pg16` instead of plain postgres:16 to get pgvector extension pre-installed.

**Verification:** `docker compose up -d && docker compose ps`

---

### Task 5.2 — Setup Husky + lint-staged
**Type:** tooling

Commands:
```bash
pnpm exec husky init
echo 'pnpm lint-staged' > .husky/pre-commit
```

**Root package.json additions:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json,yaml,yml}": ["prettier --write"]
  }
}
```

**Verification:** `ls .husky/pre-commit`

---

### Task 5.3 — Setup commitlint
**Type:** file
**File:** `commitlint.config.js`

```javascript
module.exports = { extends: ['@commitlint/config-conventional'] };
```

Add to `.husky/commit-msg`:
```
pnpm exec commitlint --edit $1
```

**Verification:** `echo "feat: test commit" | pnpm exec commitlint`

---

### Task 5.4 — Create GitHub Actions CI pipeline
**Type:** file
**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Build packages
        run: pnpm build --filter='./packages/*'

  test:
    name: Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ai_speaking_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ai_speaking_test
      REDIS_URL: redis://localhost:6379
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @ai-platform/prisma db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ai_speaking_test
      - run: pnpm test
```

**Verification:** Check CI passes on push to GitHub

---

### Task 5.5 — Create CD stub
**Type:** file
**File:** `.github/workflows/cd.yml`

```yaml
name: CD (Deploy)
# Stub — ArgoCD integration implemented in Phase 7
on:
  push:
    branches: [main]
jobs:
  deploy:
    name: Deploy (Phase 7)
    runs-on: ubuntu-latest
    steps:
      - run: echo "ArgoCD deployment configured in Phase 7"
```

---

### Task 5.6 — Final workspace verification
**Type:** verification

Run in sequence:
```bash
# 1. Install all dependencies
pnpm install

# 2. Build all packages (in dependency order)
pnpm build --filter='./packages/*'

# 3. Typecheck all
pnpm typecheck

# 4. Lint all
pnpm lint

# 5. Start Docker services
docker compose up -d

# 6. Wait for postgres health
sleep 5

# 7. Run DB migration
pnpm db:migrate

# 8. Run seed
pnpm db:seed

# 9. Verify tables exist
docker exec ai_speaking_postgres psql -U postgres -d ai_speaking_db -c "\dt" | grep users

# 10. Verify Redis
docker exec ai_speaking_redis redis-cli ping
```

**Expected output:** All commands succeed, `users` table visible in psql output, Redis returns PONG.

---

## Exit Criteria Verification

| Criterion | Verification Command | Expected |
|---|---|---|
| pnpm install succeeds | `pnpm install` | No errors |
| All packages build | `pnpm build --filter='./packages/*'` | No errors |
| TypeScript compiles | `pnpm typecheck` | No errors |
| Lint passes | `pnpm lint` | No errors |
| DB migration succeeds | `pnpm db:migrate` | "All migrations applied" |
| 30 tables created | `psql ... -c "\dt" \| wc -l` | >= 32 lines |
| Docker services healthy | `docker compose ps` | All "healthy" |
| Redis responds | `docker exec ai_speaking_redis redis-cli ping` | PONG |
| Seed runs | `pnpm db:seed` | No errors |

---

## Task Summary

| Wave | Tasks | Focus |
|---|---|---|
| Wave 1 | 6 tasks | Root scaffold: package.json, pnpm, turbo, tsconfig, .env, .gitignore |
| Wave 2 | 7 tasks | Shared packages: types, config, logger, utils, auth, ai-sdk, ui |
| Wave 3 | 5 tasks | App scaffolding: web, api, workers, admin, ai-gateway |
| Wave 4 | 4 tasks | Database: prisma package, schema (30 tables), extensions migration, seed |
| Wave 5 | 6 tasks | Quality: docker-compose, husky, commitlint, GitHub Actions CI/CD |
| **Total** | **28 tasks** | |

**Next:** `/gsd:execute-phase 1`
