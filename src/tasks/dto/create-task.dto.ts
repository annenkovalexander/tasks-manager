import {
  IsObject, IsString, IsArray, ValidateNested, IsOptional, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FindingDto } from './finding.dto.js';

class FileDto {
  @IsString() path: string;
  @IsString() name: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() assumed_role?: string;
  @IsOptional() @IsString() assumed_layer?: string;
  @IsOptional() @IsString() responsibility?: string;
  @IsOptional() @IsString() context_confidence?: string;
}

class SummaryDto {
  @IsOptional() @IsString() overall_quality?: string;
  @IsOptional() @IsBoolean() critical_issues_found?: boolean;
  @IsOptional() @IsString() review_confidence?: string;
  @IsOptional() @IsBoolean() needs_context?: boolean;
  @IsOptional() @IsArray() missing_context?: string[];
  @IsOptional() @IsString() notes?: string;
}

export class CreateTaskDto {
  @IsString()
  prompt_version: string;

  @IsObject()
  @ValidateNested()
  @Type(() => FileDto)
  file: FileDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SummaryDto)
  summary: SummaryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FindingDto)
  findings: FindingDto[];

  @IsOptional()
  @IsArray()
  improvements?: any[];

  @IsOptional()
  @IsString()
  parentTagName?: string;

  @IsOptional()
  @IsString()
  tagName?: string;
}