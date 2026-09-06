import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsIn,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export const LESSON_CONTENT_TYPES = ['TEXT', 'VIDEO', 'QUIZ', 'SPEAKING', 'VOCABULARY'] as const;
export type LessonContentType = (typeof LESSON_CONTENT_TYPES)[number];

export class CreateLessonDto {
  @IsUUID('4')
  courseId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  lessonOrder!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  lessonOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

export class CreateLessonContentDto {
  @IsIn(LESSON_CONTENT_TYPES)
  contentType!: LessonContentType;

  @IsObject()
  content!: Record<string, unknown>;
}

export class UpdateLessonContentDto {
  @IsOptional()
  @IsIn(LESSON_CONTENT_TYPES)
  contentType?: LessonContentType;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}

export class UpdateProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progressPercentage?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
