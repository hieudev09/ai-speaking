const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface PronunciationErrorItem {
  id: string;
  word: string;
  expectedPronunciation: string | null;
  actualPronunciation: string | null;
  severity: 'low' | 'medium' | 'high' | string;
}

export interface AssessmentScoresDetail {
  pronunciationScore: number;
  fluencyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
}

export interface AssessmentFeedbackInfo {
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
}

export interface SpeakingAssessmentResponse {
  id: string;
  userId: string;
  conversationId: string | null;
  overallScore: number;
  cefrLevel: string;
  ieltsBand: number;
  transcript: string;
  audioUrl?: string;
  details: AssessmentScoresDetail;
  feedback: AssessmentFeedbackInfo;
  errors: PronunciationErrorItem[];
  createdAt: string;
}

/**
 * Upload an audio recording and receive instant 5-dimension AI speaking assessment.
 */
export async function submitAudioAssessment(
  formData: FormData,
): Promise<SpeakingAssessmentResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}/assessments/upload`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Upload failed with status ${res.status}`);
  }

  return data as SpeakingAssessmentResponse;
}

/**
 * Fetch specific assessment by ID.
 */
export async function getAssessment(id: string): Promise<SpeakingAssessmentResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/assessments/${id}`, {
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Failed to fetch assessment ${id}`);
  }

  return data as SpeakingAssessmentResponse;
}

/**
 * Fetch paginated speaking assessment history.
 */
export async function getUserAssessmentHistory(page = 1, limit = 10) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/assessments/history?page=${page}&limit=${limit}`, {
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to fetch history');
  }

  return data;
}
