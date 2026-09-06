import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAssessmentDto {
  @IsOptional()
  @IsUUID()
  audioFileId?: string;

  @IsOptional()
  @IsString()
  transcriptText?: string;

  @IsOptional()
  @IsString()
  expectedText?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;
}

export class QueryAssessmentDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
