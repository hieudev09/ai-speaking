// ==================== ENUMS ====================

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum SenderType {
  USER = 'USER',
  AI = 'AI',
  SYSTEM = 'SYSTEM',
}

export enum AIProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI',
}

export enum AITask {
  GRAMMAR_CORRECTION = 'grammar-correction',
  PRONUNCIATION_FEEDBACK = 'pronunciation-feedback',
  KNOWLEDGE_SEARCH = 'knowledge-search',
  LONG_CONVERSATION = 'long-conversation',
  STUDY_PLAN = 'study-plan',
  IELTS_FEEDBACK = 'ielts-feedback',
  QUICK_CHAT = 'quick-chat',
  DAILY_PRACTICE = 'daily-practice',
  SPEAKING_ASSESSMENT = 'speaking-assessment',
}

export enum LessonContentType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  QUIZ = 'QUIZ',
  SPEAKING = 'SPEAKING',
  VOCABULARY = 'VOCABULARY',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum QueueName {
  EMAIL = 'email_queue',
  SPEECH = 'speech_queue',
  ASSESSMENT = 'assessment_queue',
  ANALYTICS = 'analytics_queue',
  NOTIFICATION = 'notification_queue',
}

export enum AIRole {
  TEACHER = 'Teacher',
  FRIEND = 'Friend',
  INTERVIEWER = 'Interviewer',
  CUSTOMER = 'Customer',
  EXAMINER = 'Examiner',
  BUSINESS_PARTNER = 'Business Partner',
  IELTS_EXAMINER = 'IELTS Examiner',
}

export enum ConversationTopic {
  JOB_INTERVIEW = 'Job Interview',
  DAILY_CONVERSATION = 'Daily Conversation',
  TRAVEL = 'Travel',
  BUSINESS_MEETING = 'Business Meeting',
  IELTS_SPEAKING = 'IELTS Speaking',
  TOEIC_SPEAKING = 'TOEIC Speaking',
  CUSTOMER_SERVICE = 'Customer Service',
  ACADEMIC_DISCUSSION = 'Academic Discussion',
}

export enum EnglishLevel {
  BEGINNER = 'Beginner',
  ELEMENTARY = 'Elementary',
  INTERMEDIATE = 'Intermediate',
  UPPER_INTERMEDIATE = 'Upper Intermediate',
  ADVANCED = 'Advanced',
}

export enum LearningGoal {
  IELTS = 'IELTS',
  TOEIC = 'TOEIC',
  JOB_INTERVIEW = 'Job Interview',
  DAILY_COMMUNICATION = 'Daily Communication',
  BUSINESS_ENGLISH = 'Business English',
  STUDY_ABROAD = 'Study Abroad',
}

// ==================== CONSTANTS ====================

/**
 * LOCKED: Assessment scoring weights from 05-AI-ARCHITECTURE.md
 * Overall = 25% Pronunciation + 20% Fluency + 20% Grammar + 20% Vocabulary + 15% Coherence
 */
export const ASSESSMENT_WEIGHTS = {
  pronunciation: 0.25,
  fluency: 0.20,
  grammar: 0.20,
  vocabulary: 0.20,
  coherence: 0.15,
} as const;

/** Redis cache TTL in seconds */
export const CACHE_TTL = {
  PROFILE: 3600,       // 1 hour
  LESSON: 21600,       // 6 hours
  AI_RESPONSE: 86400,  // 24 hours
  SESSION: 900,        // 15 minutes
  RATE_LIMIT: 60,      // 1 minute window
} as const;

/** Redis cache key generators */
export const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  lesson: (id: string) => `lesson:${id}`,
  conversation: (id: string) => `conversation:${id}`,
  aiResponse: (hash: string) => `ai:response:${hash}`,
  rateLimit: (ip: string) => `rate:${ip}`,
} as const;

/** Free plan daily conversation limit */
export const FREE_PLAN_DAILY_LIMIT = 10;

/** Audio processing constraints */
export const AUDIO_CONSTRAINTS = {
  MAX_FILE_SIZE_MB: 50,
  SUPPORTED_FORMATS: ['mp3', 'wav', 'm4a', 'webm'] as const,
  MAX_DURATION_SECONDS: 600, // 10 minutes
};

/** RAG embedding config */
export const RAG_CONFIG = {
  CHUNK_SIZE_TOKENS: 500,
  CHUNK_OVERLAP_TOKENS: 50,
  TOP_K_RESULTS: 5,
  EMBEDDING_MODEL_PRIMARY: 'text-embedding-3-large',
  EMBEDDING_MODEL_FALLBACK: 'text-embedding-3-small',
} as const;

// ==================== INTERFACES ====================

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

// ==================== DTOs ====================

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserProfileDto {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  country: string | null;
  nativeLanguage: string | null;
  englishLevel: EnglishLevel | null;
  learningGoal: LearningGoal | null;
}

export interface CourseDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: EnglishLevel;
  status: string;
  lessonCount?: number;
}

export interface LessonDto {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  lessonOrder: number;
  durationMinutes: number | null;
}

export interface ConversationDto {
  id: string;
  userId: string;
  title: string | null;
  topic: ConversationTopic | null;
  aiRole: AIRole | null;
  status: ConversationStatus;
  messageCount?: number;
  createdAt: string;
}

export interface PronunciationErrorDto {
  id: string;
  assessmentId: string;
  word: string;
  expectedPronunciation: string | null;
  actualPronunciation: string | null;
  severity: 'low' | 'medium' | 'high' | string;
}

export interface AssessmentDto {
  id: string;
  userId: string;
  conversationId: string | null;
  overallScore: number | null;
  cefrLevel?: string | null;
  ieltsBand?: number | null;
  transcript?: string | null;
  details?: AssessmentDetailDto;
  feedback?: AssessmentFeedbackDto;
  errors?: PronunciationErrorDto[];
  createdAt: string;
}

export interface AssessmentDetailDto {
  pronunciationScore: number | null;
  fluencyScore: number | null;
  grammarScore: number | null;
  vocabularyScore: number | null;
  coherenceScore: number | null;
}

export interface AssessmentFeedbackDto {
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
}

export interface AudioUploadResponseDto {
  audioFileId: string;
  fileUrl: string;
  durationSeconds?: number;
  mimeType?: string;
  fileSize?: number;
}

export interface CreateAssessmentDto {
  audioFileId?: string;
  transcriptText?: string;
  expectedText?: string;
  conversationId?: string;
  lessonId?: string;
}


export interface SubscriptionPlanDto {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  aiUsageLimit: number; // -1 = unlimited
  features: string[];
}

export interface UserSubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus | string;
  aiUsageLimit: number;
  daysRemaining: number;
  isUnlimited: boolean;
}

export interface QuotaStatusDto {
  usedToday: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  canProceed: boolean;
  planName: string;
}

export interface CreateCheckoutDto {
  planId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResponseDto {
  sessionId?: string;
  checkoutUrl: string;
  isMock?: boolean;
}

export interface PaymentDto {
  id: string;
  userId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentStatus: PaymentStatus | string;
  externalId: string | null;
  createdAt: string;
  invoice?: InvoiceDto | null;
}

export interface InvoiceDto {
  id: string;
  paymentId: string;
  invoiceNumber: string;
  invoiceUrl: string | null;
  createdAt: string;
}

// ==================== GAMIFICATION DTOs ====================

export interface UserStreakDto {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
  streakStatus: 'active' | 'pending' | 'at_risk' | 'broken';
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  condition?: Record<string, unknown> | null;
}

export interface UserAchievementDto {
  id: string;
  achievementId: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  unlockedAt: string;
  isUnlocked: boolean;
  progress?: number; // 0 - 100
}

// ==================== NOTIFICATION DTOs ====================

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string | null;
  createdAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: string;
}

// ==================== RECOMMENDATION DTOs ====================

export interface RecommendationDto {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'conversation' | 'pronunciation_drill' | 'ielts_practice';
  targetSkill: 'pronunciation' | 'fluency' | 'grammar' | 'vocabulary' | 'coherence' | 'exam_prep';
  actionUrl: string;
  level: EnglishLevel | string;
  reason: string;
}

export interface UserRecommendationsDto {
  weakestSkill: string | null;
  averageScore: number;
  recommendations: RecommendationDto[];
}

// ==================== ADMIN & ANALYTICS DTOs ====================

export interface AdminUserDto {
  id: string;
  email: string;
  role: UserRole | string;
  status: UserStatus | string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    englishLevel: string | null;
    learningGoal: string | null;
  } | null;
  conversationCount: number;
  assessmentCount: number;
  currentPlan: string;
}

export interface UpdateUserStatusDto {
  status?: UserStatus | string;
  role?: UserRole | string;
}

export interface AdminAuditLogDto {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DailyTrendDto {
  date: string;
  activeUsers: number;
  newUsers: number;
  conversations: number;
  assessments: number;
}

export interface AnalyticsDashboardDto {
  totalUsers: number;
  dau: number;
  mau: number;
  totalConversations: number;
  totalAssessments: number;
  totalRevenue: number;
  planBreakdown: {
    free: number;
    premium: number;
  };
  dailyTrends: DailyTrendDto[];
}

export interface UserAnalyticsDto {
  totalConversations: number;
  totalAssessments: number;
  averageScore: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
}

export interface PromptTemplateDto {
  id: string;
  name: string;
  version: number;
  role: string | null;
  systemPrompt: string;
  temperature: number;
  active: boolean;
  createdAt: string;
}

export interface UpdatePromptTemplateDto {
  systemPrompt?: string;
  temperature?: number;
  active?: boolean;
}



// ==================== JOB PAYLOADS ====================

export interface SpeechJobPayload {
  audioFileId: string;
  userId: string;
  conversationId?: string;
}

export interface AssessmentJobPayload {
  transcriptId: string;
  userId: string;
  conversationId?: string;
}

export interface EmailJobPayload {
  to: string;
  templateName: string;
  variables: Record<string, unknown>;
}

export interface NotificationJobPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
}

export interface AnalyticsJobPayload {
  date: string; // YYYY-MM-DD
}
