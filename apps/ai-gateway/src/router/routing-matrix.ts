import { AIProvider, AITask } from '@ai-platform/types';

/**
 * LOCKED: AI routing matrix from docs/PRD/05-AI-ARCHITECTURE.md
 * Determines which AI provider handles each task type.
 * DO NOT CHANGE without updating the architecture document.
 */
export const ROUTING_MATRIX: Record<AITask, AIProvider> = {
  [AITask.GRAMMAR_CORRECTION]: AIProvider.OPENAI,
  [AITask.PRONUNCIATION_FEEDBACK]: AIProvider.OPENAI,
  [AITask.KNOWLEDGE_SEARCH]: AIProvider.OPENAI,
  [AITask.SPEAKING_ASSESSMENT]: AIProvider.OPENAI,
  [AITask.LONG_CONVERSATION]: AIProvider.CLAUDE,
  [AITask.STUDY_PLAN]: AIProvider.CLAUDE,
  [AITask.IELTS_FEEDBACK]: AIProvider.CLAUDE,
  [AITask.QUICK_CHAT]: AIProvider.GEMINI,
  [AITask.DAILY_PRACTICE]: AIProvider.GEMINI,
};

/**
 * LOCKED: Fallback chain — if primary provider fails, try in order
 */
export const FALLBACK_CHAIN: AIProvider[] = [
  AIProvider.OPENAI,
  AIProvider.CLAUDE,
  AIProvider.GEMINI,
];
