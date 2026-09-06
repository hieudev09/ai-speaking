import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EnglishLevel, LearningGoal } from '@ai-platform/types';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nativeLanguage?: string;

  @IsEnum(EnglishLevel)
  @IsOptional()
  englishLevel?: EnglishLevel;

  @IsEnum(LearningGoal)
  @IsOptional()
  learningGoal?: LearningGoal;
}

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  preferredLanguage?: string;

  @IsBoolean()
  @IsOptional()
  notificationEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  darkMode?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;
}
