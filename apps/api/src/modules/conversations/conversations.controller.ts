import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, interval, map, take } from 'rxjs';
import { ConversationsService } from './conversations.service.js';
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
  QueryConversationDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.createConversation(user.sub, dto);
  }

  @Get()
  async listConversations(
    @Query() query: QueryConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.getUserConversations(user.sub, query);
  }

  @Get(':id')
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.getConversation(id, user.sub);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.sendMessage(id, user.sub, dto);
  }

  /**
   * Server-Sent Events (SSE) endpoint for real-time streaming response
   */
  @Sse(':id/stream')
  streamMessage(): Observable<MessageEvent> {
    return interval(100).pipe(
      take(10),
      map((num) => ({
        data: { chunk: `Streaming word ${num + 1} `, done: num === 9 },
      })),
    );
  }

  @Patch(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.updateConversation(id, user.sub, dto);
  }

  @Delete(':id')
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.deleteConversation(id, user.sub);
  }
}
