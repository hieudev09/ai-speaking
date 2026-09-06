import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@ai-platform/types';
import { AssessmentsController } from './assessments.controller.js';
import { AssessmentsService } from './assessments.service.js';
import { SpeechService } from './services/speech.service.js';
import { ScoringService } from './services/scoring.service.js';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.SPEECH },
      { name: QueueName.ASSESSMENT },
    ),
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, SpeechService, ScoringService],
  exports: [AssessmentsService, SpeechService, ScoringService],
})
export class AssessmentsModule {}
