import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';

export class FindingDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  @IsIn([
    'confirmed_issue', 'conditional_risk', 'contract_mismatch',
    'architecture_question', 'input_integrity', 'improvement', 'needs_context',
  ])
  kind: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  confidence?: string;

  @IsOptional()
  @IsString()
  release_impact?: string;

  @IsOptional()
  @IsArray()
  required_context?: string[];

  @IsOptional()
  @IsArray()
  affected_locations?: any[];
}