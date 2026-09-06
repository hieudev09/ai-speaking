# Phase 4: Speaking Engine & Assessment — Context

**Status:** Completed
**Domain:** Voice recording pipeline, STT transcription (Whisper API & local deterministic fallback), 5-dimension speaking assessment engine (Pronunciation, Fluency, Grammar, Vocabulary, Coherence), BullMQ speech & assessment workers, and interactive lesson speaking viewer with real-time waveform and word-level phonetics.

## Deliverables Completed:

1. **Shared Types (`packages/types`)**:
   - `PronunciationErrorDto`, `SpeakingAssessmentResultDto`, `CreateAssessmentDto`, `AudioUploadResponseDto`
   - Extended `AssessmentDto` with `cefrLevel`, `ieltsBand`, `transcript`, `errors`

2. **Assessments API Module (`apps/api/src/modules/assessments`)**:
   - `SpeechService`: Audio file validation (50MB, formats webm/mp3/wav/m4a/ogg), local storage adapter, OpenAI Whisper API integration with local phonetic fallback, database persistence to `audio_files` and `transcripts`
   - `ScoringService`: 5-dimension scoring algorithm:
     - Pronunciation (25% weight, word accuracy, phoneme issues)
     - Fluency (20% weight, WPM analysis, pause & filler word detection)
     - Grammar (20% weight, structure, tense consistency)
     - Vocabulary (20% weight, Type-Token Ratio, complexity)
     - Coherence (15% weight, linking transitions)
     - Formula: $0.25P + 0.20F + 0.20G + 0.20V + 0.15C$
     - Mapping to CEFR (A1-C2) and IELTS bands (3.0-9.0)
     - Strengths, weaknesses, actionable recommendations, and word-level error generation
   - `AssessmentsService`: End-to-end audio/text assessment flow, automated lesson progress update upon passing (score >= 60), pagination for user history, BullMQ queue dispatching
   - `AssessmentsController`:
     - `POST /api/v1/assessments/upload` (Multipart audio file upload & instant evaluation)
     - `POST /api/v1/assessments` (JSON payload assessment trigger)
     - `GET /api/v1/assessments/history` (User speaking assessment history)
     - `GET /api/v1/assessments/:id` (Detailed assessment result)

3. **Background Processing Workers (`apps/workers`)**:
   - `PrismaService` integrated for worker database operations
   - `SpeechProcessor`: Handles `speech_queue` jobs (audio -> STT -> transcripts -> queues assessment)
   - `AssessmentProcessor`: Handles `assessment_queue` jobs (evaluates 5 dimensions -> persists assessment and feedback)

4. **Frontend Interactive Speaking Engine (`apps/web`)**:
   - `useAudioRecorder`: Custom hook using browser `MediaRecorder` & Web Audio API `AnalyserNode`
   - `AudioWaveform`: HTML5 Canvas animated waveform visualizer with glowing gradient
   - `AssessmentResultCard`: Circular score gauge, CEFR/IELTS badges, 5D score breakdown, interactive word-level pronunciation highlights (click for phonetics), AI feedback tabs
   - `SpeakingPracticeContent`: Replaces placeholder in lesson viewer with complete studio recording, playback review, and AI assessment flow
   - `lib/assessments.ts`: Typed client for submitting audio and fetching assessment data
