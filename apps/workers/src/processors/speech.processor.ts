import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { QueueName, type SpeechJobPayload, type AssessmentJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';
import { PrismaService } from '../prisma.service.js';

const log = createLogger('SpeechProcessor');

@Processor(QueueName.SPEECH)
export class SpeechProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.ASSESSMENT)
    private readonly assessmentQueue: Queue<AssessmentJobPayload>,
  ) {
    super();
  }

  async process(job: Job<SpeechJobPayload>): Promise<void> {
    const { audioFileId, userId, conversationId } = job.data;
    log.info({ jobId: job.id, audioFileId, userId }, 'Processing speech transcription job');

    const audioFile = await this.prisma.audioFile.findUnique({
      where: { id: audioFileId },
    });

    if (!audioFile) {
      log.warn({ audioFileId }, 'Audio file not found for speech job');
      return;
    }

    // Check if transcript already exists
    let transcript = await this.prisma.transcript.findFirst({
      where: { audioFileId },
    });

    if (!transcript) {
      // In production, Whisper API call or local STT
      const transcriptText = 'Hello, this is my English speaking recording.';
      transcript = await this.prisma.transcript.create({
        data: {
          audioFileId,
          transcriptText,
          language: 'en',
        },
      });
    }

    // Queue assessment job
    await this.assessmentQueue.add('assess_speech', {
      transcriptId: transcript.id,
      userId,
      conversationId,
    });

    log.info({ jobId: job.id, transcriptId: transcript.id }, 'Speech transcription complete, assessment queued');
  }
}
