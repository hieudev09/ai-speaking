import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PromptTemplatesService } from './prompt-templates.service.js';
import { AiService } from './ai.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { UserRole } from '@ai-platform/types';

@Controller('ai')
export class AiController {
  constructor(
    private readonly promptTemplatesService: PromptTemplatesService,
    private readonly aiService: AiService,
  ) {}

  @Get('templates')
  async listTemplates() {
    return this.promptTemplatesService.listTemplates();
  }

  @Get('templates/:name')
  async getTemplate(@Param('name') name: string) {
    const content = await this.promptTemplatesService.getTemplate(name);
    return { name, content };
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async saveTemplate(
    @Body('name') name: string,
    @Body('content') content: string,
  ) {
    const version = await this.promptTemplatesService.createOrUpdateTemplate(name, content);
    return { success: true, name, version };
  }

  @Post('test-complete')
  @UseGuards(JwtAuthGuard)
  async testComplete(
    @Body('task') task: string,
    @Body('message') message: string,
  ) {
    const response = await this.aiService.complete(
      (task as any) ?? 'quick-chat',
      [{ role: 'user', content: message ?? 'Hello AI' }],
    );
    return response;
  }
}
