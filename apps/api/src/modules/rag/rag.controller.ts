import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RagService } from './rag.service.js';
import { CreateDocumentDto, SearchKnowledgeDto } from './dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { CurrentUser, Roles } from '../auth/decorators/index.js';
import { UserRole } from '@ai-platform/types';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get('documents')
  async listDocuments() {
    return this.ragService.listDocuments();
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string) {
    return this.ragService.getDocument(id);
  }

  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async ingestDocument(@Body() dto: CreateDocumentDto) {
    return this.ragService.ingestDocument(dto);
  }

  @Post('search')
  @UseGuards(JwtAuthGuard)
  async searchKnowledge(
    @Body() dto: SearchKnowledgeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ragService.searchKnowledge(dto, user.sub);
  }
}
