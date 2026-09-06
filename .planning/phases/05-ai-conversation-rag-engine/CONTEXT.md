# Phase 5: AI Conversation & RAG Engine — Context

**Status:** Completed
**Domain:** Multi-LLM provider abstraction (OpenAI, Claude, Gemini), routing matrix and fallback chain, cost tracking, prompt template engine with versioning and interpolation, RAG pipeline with 500-token chunking and hybrid vector/keyword search, short-term Redis context memory and long-term PostgreSQL history, automatic context compression, and interactive Next.js AI Conversation Studio.

## Deliverables Completed:

1. **Multi-LLM AI SDK & Gateway (`packages/ai-sdk` & `apps/ai-gateway`)**:
   - `OpenAIProvider`, `ClaudeProvider`, `GeminiProvider` with real HTTP completion and embedding support.
   - Built-in intelligent fallback for offline dev/testing when API keys are not configured.
   - `AIRouter` implementing locked routing matrix from `05-AI-ARCHITECTURE.md` (OpenAI for grammar/pronunciation/assessment, Claude for long conversation/study plans/IELTS, Gemini for quick chat/daily practice).
   - Fallback chain: Primary -> Alternative -> Static fallback message.
   - `calculateAiCost`: Real-time token usage and cost calculation.
   - `CostTrackerService`: Tracking `AiRequest` metrics (tokens, cost, latency).

2. **RAG Knowledge Engine (`apps/api/src/modules/rag`)**:
   - `RagService`:
     - Text chunking (500 tokens / 400 words, 50-word overlap) preserving semantic boundaries.
     - Vector embedding generation.
     - Hybrid search formula: $0.70 \times \text{VectorScore} + 0.30 \times \text{KeywordScore}$.
     - Context augmentation builder for LLM system prompts (`buildAugmentedContext`).
     - Audit logging to `retrieval_logs` table.
     - Auto-seeding of core ESL knowledge documents (Cambridge IELTS 3-part framework, Common ESL Grammar Pitfalls, Business English Expressions, Connected Speech & Pronunciation).
   - `RagController`:
     - `POST /api/v1/rag/documents`: Ingest knowledge documents.
     - `GET /api/v1/rag/documents`: List ingested documents and chunks.
     - `GET /api/v1/rag/documents/:id`: Document detail with chunk breakdown.
     - `POST /api/v1/rag/search`: Hybrid search top-K knowledge chunks.

3. **Prompt Template System & AI Module (`apps/api/src/modules/ai`)**:
   - `PromptTemplatesService`:
     - Versioning (v1, v2...) and rollback support in `ai_prompt_templates`.
     - Seeded templates: `conversation_teacher`, `conversation_interviewer`, `conversation_friend`, `ielts_examiner`, `business_mentor`, `grammar_checker`, `pronunciation_feedback`.
     - Template interpolation engine supporting `{{role}}`, `{{topic}}`, `{{userLevel}}`, `{{learningGoal}}`, `{{ragContext}}`.
   - `AiService`: Integrates `AIRouter` with automatic `AiRequest` logging and latency tracking.
   - `AiController`: Endpoints to list and manage prompt templates.

4. **Redis Session & Context Memory Service (`apps/api/src/redis`)**:
   - `RedisService`: Fast cache and short-term session storage with transparent in-memory fallback for local environments without live Redis.

5. **Conversation Module (`apps/api/src/modules/conversations`)**:
   - Quota enforcement: Free plan limit of 10 conversations/day; unlimited for Premium.
   - `ConversationsService`:
     - `createConversation`: Starts conversation with selected persona and scenario, generates welcoming initial icebreaker message, caches in Redis.
     - `sendMessage`: Multi-turn dialog handling, RAG retrieval augmentation, context compression (summarizes older turns when > 10 messages), AI Router execution, message persistence.
     - `getUserConversations`: Paginated list of user conversations with message counts and status.
     - `getConversation`: Full message history with context snapshots.
     - `updateConversation`: Status change (Active/Ended) and title/topic edits.
     - `deleteConversation`: Removes conversation and clears cache.
   - `ConversationsController`: Full REST endpoints + Server-Sent Events (`GET :id/stream`).

6. **Interactive AI Conversation Frontend (`apps/web`)**:
   - `lib/conversations.ts`: Typed client for all conversation APIs.
   - `/conversations` (Lobby):
     - Quick start AI Persona cards (Teacher, Interviewer, Friend, IELTS Examiner, Business Executive) with level guidance.
     - Preset scenario selection chips (Daily Conversation, Job Interview, IELTS Speaking, Business Meeting, etc.).
     - Custom session creation modal.
     - Conversation history list with active/ended status, last message preview, and delete action.
   - `/conversations/[id]` (Studio):
     - Real-time conversation stream with AI and User bubbles.
     - Browser Text-To-Speech (TTS) integration allowing learners to listen to native English pronunciations.
     - Integrated voice recording via `useAudioRecorder` with duration counter and live audio status.
     - Expandable textarea with Enter-to-send and Shift+Enter formatting.
     - Sidebar with recent sessions and instant switching.
