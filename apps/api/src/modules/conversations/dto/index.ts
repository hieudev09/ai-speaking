import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { AIRole, ConversationTopic, ConversationStatus } from '@ai-platform/types';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  topic?: ConversationTopic | string;

  @IsString()
  @IsOptional()
  aiRole?: AIRole | string;
}

export class SendMessageDto {
  @IsString()
  message!: string;

  @IsString()
  @IsOptional()
  audioFileId?: string;
}

export class UpdateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  status?: ConversationStatus | string;
}

export class QueryConversationDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;
}
