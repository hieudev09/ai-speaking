import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string = 'beginner';

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string = 'draft';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}

export class CourseFilterDto {
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
