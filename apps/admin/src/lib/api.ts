import type {
  AnalyticsDashboardDto,
  AdminUserDto,
  AdminAuditLogDto,
  PromptTemplateDto,
  UpdateUserStatusDto,
  UpdatePromptTemplateDto,
} from '@ai-platform/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// Fallback mock KPIs for standalone UI preview
export const MOCK_KPIS: AnalyticsDashboardDto = {
  totalUsers: 1420,
  dau: 384,
  mau: 1190,
  totalConversations: 8940,
  totalAssessments: 3410,
  totalRevenue: 12580.5,
  planBreakdown: {
    free: 1180,
    premium: 240,
  },
  dailyTrends: [
    { date: '2026-08-31', activeUsers: 290, newUsers: 45, conversations: 580, assessments: 240 },
    { date: '2026-09-01', activeUsers: 310, newUsers: 50, conversations: 620, assessments: 280 },
    { date: '2026-09-02', activeUsers: 340, newUsers: 55, conversations: 710, assessments: 310 },
    { date: '2026-09-03', activeUsers: 350, newUsers: 60, conversations: 760, assessments: 330 },
    { date: '2026-09-04', activeUsers: 370, newUsers: 52, conversations: 810, assessments: 360 },
    { date: '2026-09-05', activeUsers: 395, newUsers: 68, conversations: 890, assessments: 390 },
    { date: '2026-09-06', activeUsers: 384, newUsers: 62, conversations: 840, assessments: 375 },
  ],
};

export async function fetchDashboardKPIs(): Promise<AnalyticsDashboardDto> {
  try {
    return await adminFetch<AnalyticsDashboardDto>('/analytics/dashboard');
  } catch {
    return MOCK_KPIS;
  }
}

export async function fetchAdminUsers(search?: string, role?: string, status?: string): Promise<AdminUserDto[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    return await adminFetch<AdminUserDto[]>(`/admin/users?${params.toString()}`);
  } catch {
    return [
      {
        id: 'u-1',
        email: 'admin@ai-speaking.com',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: '2026-08-20T10:00:00Z',
        lastLoginAt: '2026-09-06T08:30:00Z',
        profile: { firstName: 'System', lastName: 'Administrator', englishLevel: 'Advanced', learningGoal: 'Platform Management' },
        conversationCount: 142,
        assessmentCount: 88,
        currentPlan: 'Staff Admin',
      },
      {
        id: 'u-2',
        email: 'sarah.connor@example.com',
        role: 'premium',
        status: 'active',
        emailVerified: true,
        createdAt: '2026-08-25T14:20:00Z',
        lastLoginAt: '2026-09-06T07:15:00Z',
        profile: { firstName: 'Sarah', lastName: 'Connor', englishLevel: 'Upper Intermediate', learningGoal: 'IELTS' },
        conversationCount: 78,
        assessmentCount: 45,
        currentPlan: 'Premium Yearly',
      },
      {
        id: 'u-3',
        email: 'alex.tanaka@example.com',
        role: 'user',
        status: 'active',
        emailVerified: true,
        createdAt: '2026-09-01T09:12:00Z',
        lastLoginAt: '2026-09-05T18:40:00Z',
        profile: { firstName: 'Alex', lastName: 'Tanaka', englishLevel: 'Intermediate', learningGoal: 'Job Interview' },
        conversationCount: 16,
        assessmentCount: 8,
        currentPlan: 'Free',
      },
      {
        id: 'u-4',
        email: 'spammer.bot@suspicious.net',
        role: 'user',
        status: 'suspended',
        emailVerified: false,
        createdAt: '2026-09-03T11:00:00Z',
        lastLoginAt: null,
        profile: null,
        conversationCount: 0,
        assessmentCount: 0,
        currentPlan: 'Free',
      },
    ];
  }
}

export async function updateAdminUser(userId: string, dto: UpdateUserStatusDto): Promise<AdminUserDto> {
  return adminFetch<AdminUserDto>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function fetchAdminPrompts(): Promise<PromptTemplateDto[]> {
  try {
    return await adminFetch<PromptTemplateDto[]>('/admin/prompts');
  } catch {
    return [
      {
        id: 'p-1',
        name: 'conversation_teacher',
        version: 3,
        role: 'Teacher',
        systemPrompt: 'You are a warm, encouraging English teacher. Guide the user gently, correct mistakes politely, and ask follow-up questions to expand vocabulary.',
        temperature: 0.7,
        active: true,
        createdAt: '2026-08-29T12:00:00Z',
      },
      {
        id: 'p-2',
        name: 'conversation_interviewer',
        version: 2,
        role: 'Interviewer',
        systemPrompt: 'You are a senior tech hiring manager conducting a professional behavioral job interview using the STAR technique.',
        temperature: 0.6,
        active: true,
        createdAt: '2026-08-29T12:00:00Z',
      },
      {
        id: 'p-3',
        name: 'ielts_examiner',
        version: 4,
        role: 'IELTS Examiner',
        systemPrompt: 'You are an official British Council IELTS Speaking examiner. Conduct Part 1, 2, or 3 strictly following CEFR and IELTS assessment criteria.',
        temperature: 0.5,
        active: true,
        createdAt: '2026-08-29T12:00:00Z',
      },
    ];
  }
}

export async function updateAdminPrompt(templateId: string, dto: UpdatePromptTemplateDto): Promise<PromptTemplateDto> {
  return adminFetch<PromptTemplateDto>(`/admin/prompts/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function fetchAdminCourses() {
  try {
    return await adminFetch<any[]>('/admin/courses');
  } catch {
    return [
      {
        id: 'c-1',
        title: 'English Basics for Beginners',
        slug: 'english-basics',
        description: 'Start your speaking journey with essential everyday greetings and self-introductions.',
        level: 'beginner',
        status: 'published',
        lessons: [
          { id: 'l-1', title: 'Introducing Yourself', lessonOrder: 1 },
          { id: 'l-2', title: 'Daily Greetings', lessonOrder: 2 },
          { id: 'l-3', title: 'Asking for Directions', lessonOrder: 3 },
        ],
        _count: { enrollments: 840, lessons: 3 },
      },
      {
        id: 'c-2',
        title: 'Mastering the Job Interview',
        slug: 'job-interview-mastery',
        description: 'Comprehensive preparation for corporate interviews, behavioral questions, and salary negotiation.',
        level: 'intermediate',
        status: 'published',
        lessons: [
          { id: 'l-4', title: 'Tell Me About Yourself', lessonOrder: 1 },
          { id: 'l-5', title: 'Handling Difficult Questions', lessonOrder: 2 },
        ],
        _count: { enrollments: 520, lessons: 2 },
      },
    ];
  }
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLogDto[]> {
  try {
    return await adminFetch<AdminAuditLogDto[]>('/admin/audit-logs');
  } catch {
    return [
      {
        id: 'log-1',
        adminId: 'admin-1',
        action: 'UPDATE_USER',
        targetType: 'user',
        targetId: 'u-2',
        metadata: { oldRole: 'user', newRole: 'premium', reason: 'Plan upgrade verified' },
        createdAt: '2026-09-06T08:15:00Z',
      },
      {
        id: 'log-2',
        adminId: 'admin-1',
        action: 'UPDATE_PROMPT_TEMPLATE',
        targetType: 'prompt_template',
        targetId: 'p-1',
        metadata: { name: 'conversation_teacher', newVersion: 3 },
        createdAt: '2026-09-05T14:30:00Z',
      },
      {
        id: 'log-3',
        adminId: 'admin-1',
        action: 'CREATE_COURSE',
        targetType: 'course',
        targetId: 'c-2',
        metadata: { title: 'Mastering the Job Interview' },
        createdAt: '2026-09-04T10:00:00Z',
      },
    ];
  }
}
