import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class SearchKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;
}
