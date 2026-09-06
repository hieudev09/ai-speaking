import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssessmentsService } from './assessments.service.js';
import { CreateAssessmentDto, QueryAssessmentDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

interface MulterAudioFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  /**
   * POST /api/v1/assessments/upload
   * Multipart audio file upload + transcription + 5D speaking assessment.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudioAssessment(
    @UploadedFile() file: MulterAudioFile,
    @Body('expectedText') expectedText?: string,
    @Body('conversationId') conversationId?: string,
    @Body('lessonId') lessonId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required in field "audio"');
    }

    const userId = user?.sub ?? '00000000-0000-0000-0000-000000000001';

    return this.assessmentsService.processAudioAssessment(userId, file, {
      expectedText,
      conversationId,
      lessonId,
    });
  }

  /**
   * POST /api/v1/assessments
   * JSON payload to assess a transcript or existing audio file.
   */
  @Post()
  async createAssessment(
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessmentsService.createAssessmentFromDto(user.sub, dto);
  }

  /**
   * GET /api/v1/assessments/history
   * Paginated user speaking history.
   */
  @Get('history')
  async getHistory(
    @Query() query: QueryAssessmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessmentsService.getUserHistory(
      user.sub,
      query.page ? Number(query.page) : 1,
      query.limit ? Number(query.limit) : 10,
    );
  }

  /**
   * GET /api/v1/assessments/:id
   * Get specific assessment by ID.
   */
  @Get(':id')
  async getAssessment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessmentsService.getAssessmentById(id, user.sub);
  }
}
