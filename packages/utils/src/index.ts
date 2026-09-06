import { randomUUID, createHash } from 'crypto';
import type { AssessmentDetailDto } from '@ai-platform/types';
import { ASSESSMENT_WEIGHTS } from '@ai-platform/types';

// ==================== DATE HELPERS ====================

export const formatDate = (date: Date, format: 'ISO' | 'DATE' | 'DATETIME' = 'ISO'): string => {
  switch (format) {
    case 'DATE':
      return date.toISOString().split('T')[0] ?? '';
    case 'DATETIME':
      return date.toISOString().replace('T', ' ').substring(0, 19);
    default:
      return date.toISOString();
  }
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const daysBetween = (a: Date, b: Date): number =>
  Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ==================== STRING HELPERS ====================

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.***';
  const masked = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
  return `${masked}@${domain}`;
};

export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.substring(0, maxLength - 3)}...`;

export const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// ==================== ID HELPERS ====================

export const generateId = (): string => randomUUID();

export const hashString = async (input: string): Promise<string> => {
  return createHash('sha256').update(input).digest('hex');
};

// ==================== VALIDATION ====================

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

// ==================== ASSESSMENT ====================

/**
 * Calculate overall speaking score using LOCKED formula:
 * 25% Pronunciation + 20% Fluency + 20% Grammar + 20% Vocabulary + 15% Coherence
 */
export const calculateOverallScore = (scores: Partial<AssessmentDetailDto>): number => {
  const { pronunciationScore, fluencyScore, grammarScore, vocabularyScore, coherenceScore } =
    scores;
  const overall =
    (pronunciationScore ?? 0) * ASSESSMENT_WEIGHTS.pronunciation +
    (fluencyScore ?? 0) * ASSESSMENT_WEIGHTS.fluency +
    (grammarScore ?? 0) * ASSESSMENT_WEIGHTS.grammar +
    (vocabularyScore ?? 0) * ASSESSMENT_WEIGHTS.vocabulary +
    (coherenceScore ?? 0) * ASSESSMENT_WEIGHTS.coherence;
  return Math.round(overall * 100) / 100;
};

// ==================== PAGINATION ====================

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const paginate = <T>(
  items: T[],
  total: number,
  options: PaginationOptions = {},
): PaginatedResult<T> => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const totalPages = Math.ceil(total / limit);
  return {
    data: items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const getPaginationOffset = (page: number, limit: number): number =>
  (Math.max(1, page) - 1) * limit;
