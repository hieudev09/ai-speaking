import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SpeechService, type UploadedAudioInput } from './services/speech.service.js';
import { ScoringService } from './services/scoring.service.js';
import { QueueName, type SpeechJobPayload, type AssessmentJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';
import type { CreateAssessmentDto } from './dto/index.js';

const log = createLogger('AssessmentsService');

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly speechService: SpeechService,
    private readonly scoringService: ScoringService,
    @InjectQueue(QueueName.SPEECH) private readonly speechQueue: Queue<SpeechJobPayload>,
    @InjectQueue(QueueName.ASSESSMENT) private readonly assessmentQueue: Queue<AssessmentJobPayload>,
  ) {}

  /**
   * Complete end-to-end flow: Upload audio -> Transcribe -> Score 5 dimensions -> Persist -> Return result.
   */
  async processAudioAssessment(
    userId: string,
    file: UploadedAudioInput,
    options?: {
      expectedText?: string;
      conversationId?: string;
      lessonId?: string;
    },
  ) {
    // 1. Save audio
    const audioFile = await this.speechService.saveAudioFile(
      userId,
      file,
      options?.conversationId,
    );

    // 2. Transcribe audio (Whisper API or fallback)
    const transcript = await this.speechService.transcribeAudio(
      audioFile.id,
      options?.expectedText,
    );

    // 3. Score 5 dimensions
    const evaluation = this.scoringService.evaluateSpeaking(
      transcript.transcriptText,
      options?.expectedText,
      audioFile.durationSeconds ?? undefined,
    );

    // 4. Persist assessment record in database
    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        conversationId: options?.conversationId ?? null,
        overallScore: evaluation.overallScore,
        details: {
          create: {
            pronunciationScore: evaluation.pronunciationScore,
            fluencyScore: evaluation.fluencyScore,
            grammarScore: evaluation.grammarScore,
            vocabularyScore: evaluation.vocabularyScore,
            coherenceScore: evaluation.coherenceScore,
          },
        },
        feedbacks: {
          create: {
            strengths: evaluation.feedback.strengths,
            weaknesses: evaluation.feedback.weaknesses,
            recommendations: evaluation.feedback.recommendations,
          },
        },
        errors: {
          create: evaluation.pronunciationErrors.map((err) => ({
            word: err.word,
            expectedPronunciation: err.expectedPronunciation,
            actualPronunciation: err.actualPronunciation,
            severity: err.severity,
          })),
        },
      },
      include: {
        details: true,
        feedbacks: true,
        errors: true,
      },
    });

    // 5. Update lesson progress if associated with a lesson
    if (options?.lessonId) {
      try {
        const isPassed = evaluation.overallScore >= 60;
        await this.prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId: options.lessonId,
            },
          },
          create: {
            userId,
            lessonId: options.lessonId,
            completed: isPassed,
            progressPercentage: isPassed ? 100 : Math.max(50, Math.round(evaluation.overallScore)),
          },
          update: {
            completed: isPassed,
            progressPercentage: isPassed ? 100 : Math.max(50, Math.round(evaluation.overallScore)),
          },
        });
      } catch (err) {
        log.warn({ err, lessonId: options.lessonId }, 'Could not update lesson progress after assessment');
      }
    }

    // 6. Enqueue async job for background analytics / history worker tracking
    try {
      await this.assessmentQueue.add('record_assessment', {
        transcriptId: transcript.id,
        userId,
        conversationId: options?.conversationId,
      });
    } catch {
      // Non-blocking if redis queue is temporarily unavailable in dev
    }

    log.info({ assessmentId: assessment.id, userId, overallScore: evaluation.overallScore }, 'Assessment completed');

    return {
      id: assessment.id,
      userId: assessment.userId,
      conversationId: assessment.conversationId,
      overallScore: Number(assessment.overallScore),
      cefrLevel: evaluation.cefrLevel,
      ieltsBand: evaluation.ieltsBand,
      transcript: transcript.transcriptText,
      audioUrl: audioFile.fileUrl,
      details: {
        pronunciationScore: evaluation.pronunciationScore,
        fluencyScore: evaluation.fluencyScore,
        grammarScore: evaluation.grammarScore,
        vocabularyScore: evaluation.vocabularyScore,
        coherenceScore: evaluation.coherenceScore,
      },
      feedback: {
        strengths: assessment.feedbacks?.strengths ?? null,
        weaknesses: assessment.feedbacks?.weaknesses ?? null,
        recommendations: assessment.feedbacks?.recommendations ?? null,
      },
      errors: assessment.errors.map((e) => ({
        id: e.id,
        assessmentId: e.assessmentId,
        word: e.word,
        expectedPronunciation: e.expectedPronunciation,
        actualPronunciation: e.actualPronunciation,
        severity: e.severity,
      })),
      createdAt: assessment.createdAt.toISOString(),
    };
  }

  /**
   * Create an assessment from an existing transcript or text payload.
   */
  async createAssessmentFromDto(userId: string, dto: CreateAssessmentDto) {
    let transcriptText = dto.transcriptText;
    let durationSeconds: number | undefined;

    if (dto.audioFileId) {
      const audio = await this.speechService.getAudioFile(dto.audioFileId);
      durationSeconds = audio.durationSeconds ?? undefined;
      if (!transcriptText) {
        const transcript = await this.speechService.transcribeAudio(dto.audioFileId, dto.expectedText);
        transcriptText = transcript.transcriptText;
      }
    }

    if (!transcriptText) {
      transcriptText = dto.expectedText ?? 'Hello, practice session.';
    }

    const evaluation = this.scoringService.evaluateSpeaking(
      transcriptText,
      dto.expectedText,
      durationSeconds,
    );

    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        conversationId: dto.conversationId ?? null,
        overallScore: evaluation.overallScore,
        details: {
          create: {
            pronunciationScore: evaluation.pronunciationScore,
            fluencyScore: evaluation.fluencyScore,
            grammarScore: evaluation.grammarScore,
            vocabularyScore: evaluation.vocabularyScore,
            coherenceScore: evaluation.coherenceScore,
          },
        },
        feedbacks: {
          create: {
            strengths: evaluation.feedback.strengths,
            weaknesses: evaluation.feedback.weaknesses,
            recommendations: evaluation.feedback.recommendations,
          },
        },
        errors: {
          create: evaluation.pronunciationErrors.map((err) => ({
            word: err.word,
            expectedPronunciation: err.expectedPronunciation,
            actualPronunciation: err.actualPronunciation,
            severity: err.severity,
          })),
        },
      },
      include: {
        details: true,
        feedbacks: true,
        errors: true,
      },
    });

    return {
      id: assessment.id,
      userId: assessment.userId,
      conversationId: assessment.conversationId,
      overallScore: Number(assessment.overallScore),
      cefrLevel: evaluation.cefrLevel,
      ieltsBand: evaluation.ieltsBand,
      transcript: transcriptText,
      details: {
        pronunciationScore: evaluation.pronunciationScore,
        fluencyScore: evaluation.fluencyScore,
        grammarScore: evaluation.grammarScore,
        vocabularyScore: evaluation.vocabularyScore,
        coherenceScore: evaluation.coherenceScore,
      },
      feedback: {
        strengths: assessment.feedbacks?.strengths ?? null,
        weaknesses: assessment.feedbacks?.weaknesses ?? null,
        recommendations: assessment.feedbacks?.recommendations ?? null,
      },
      errors: assessment.errors,
      createdAt: assessment.createdAt.toISOString(),
    };
  }

  /**
   * Enqueue asynchronous speech processing job via BullMQ.
   */
  async enqueueSpeechProcessing(audioFileId: string, userId: string, conversationId?: string) {
    return this.speechQueue.add('transcribe_audio', {
      audioFileId,
      userId,
      conversationId,
    });
  }

  /**
   * Get single assessment by ID.
   */
  async getAssessmentById(id: string, userId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        details: true,
        feedbacks: true,
        errors: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    if (assessment.userId !== userId) {
      log.warn({ assessmentId: id, requestedBy: userId, owner: assessment.userId }, 'Unauthorized assessment access attempt');
    }

    const overall = Number(assessment.overallScore ?? 0);
    const cefrLevel = this.scoringService.mapToCefr(overall);
    const ieltsBand = this.scoringService.mapToIelts(overall);

    return {
      id: assessment.id,
      userId: assessment.userId,
      conversationId: assessment.conversationId,
      overallScore: overall,
      cefrLevel,
      ieltsBand,
      details: assessment.details
        ? {
            pronunciationScore: Number(assessment.details.pronunciationScore ?? 0),
            fluencyScore: Number(assessment.details.fluencyScore ?? 0),
            grammarScore: Number(assessment.details.grammarScore ?? 0),
            vocabularyScore: Number(assessment.details.vocabularyScore ?? 0),
            coherenceScore: Number(assessment.details.coherenceScore ?? 0),
          }
        : null,
      feedback: assessment.feedbacks
        ? {
            strengths: assessment.feedbacks.strengths,
            weaknesses: assessment.feedbacks.weaknesses,
            recommendations: assessment.feedbacks.recommendations,
          }
        : null,
      errors: assessment.errors.map((e) => ({
        id: e.id,
        assessmentId: e.assessmentId,
        word: e.word,
        expectedPronunciation: e.expectedPronunciation,
        actualPronunciation: e.actualPronunciation,
        severity: e.severity,
      })),
      createdAt: assessment.createdAt.toISOString(),
    };
  }

  /**
   * Get paginated speaking assessment history for a user.
   */
  async getUserHistory(userId: string, page = 1, limit = 10) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.assessment.count({ where: { userId } }),
      this.prisma.assessment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          details: true,
          feedbacks: true,
        },
      }),
    ]);

    return {
      data: items.map((item) => {
        const overall = Number(item.overallScore ?? 0);
        return {
          id: item.id,
          overallScore: overall,
          cefrLevel: this.scoringService.mapToCefr(overall),
          ieltsBand: this.scoringService.mapToIelts(overall),
          details: item.details
            ? {
                pronunciationScore: Number(item.details.pronunciationScore ?? 0),
                fluencyScore: Number(item.details.fluencyScore ?? 0),
                grammarScore: Number(item.details.grammarScore ?? 0),
                vocabularyScore: Number(item.details.vocabularyScore ?? 0),
                coherenceScore: Number(item.details.coherenceScore ?? 0),
              }
            : null,
          createdAt: item.createdAt.toISOString(),
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
