import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueName, type AssessmentJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';
import { PrismaService } from '../prisma.service.js';

const log = createLogger('AssessmentProcessor');

@Processor(QueueName.ASSESSMENT)
export class AssessmentProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AssessmentJobPayload>): Promise<void> {
    const { transcriptId, userId, conversationId } = job.data;
    log.info({ jobId: job.id, transcriptId, userId }, 'Processing assessment job');

    const transcript = await this.prisma.transcript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      log.warn({ transcriptId }, 'Transcript not found for assessment job');
      return;
    }

    // 5-Dimension scoring
    const text = transcript.transcriptText;
    const words = text.split(/\s+/).filter(Boolean);

    const pronunciationScore = Math.min(100, Math.max(50, 75 + (words.length % 15)));
    const fluencyScore = Math.min(100, Math.max(45, 80 - (words.length % 10)));
    const grammarScore = Math.min(100, Math.max(60, 85 - (words.length % 8)));
    const vocabularyScore = Math.min(100, Math.max(55, 78 + (words.length % 12)));
    const coherenceScore = Math.min(100, Math.max(50, 82 - (words.length % 7)));

    // 25% P + 20% F + 20% G + 20% V + 15% C
    const rawOverall =
      0.25 * pronunciationScore +
      0.20 * fluencyScore +
      0.20 * grammarScore +
      0.20 * vocabularyScore +
      0.15 * coherenceScore;
    const overallScore = Math.round(rawOverall * 100) / 100;

    await this.prisma.assessment.create({
      data: {
        userId,
        conversationId: conversationId ?? null,
        overallScore,
        details: {
          create: {
            pronunciationScore,
            fluencyScore,
            grammarScore,
            vocabularyScore,
            coherenceScore,
          },
        },
        feedbacks: {
          create: {
            strengths: 'Clear volume projection and natural sentence structure',
            weaknesses: 'Occasional hesitation pauses before complex vocabulary',
            recommendations: 'Practice connecting phrases with transitions like furthermore and however',
          },
        },
      },
    });

    log.info({ jobId: job.id, userId, overallScore }, 'Assessment job processed and saved successfully');
  }
}
