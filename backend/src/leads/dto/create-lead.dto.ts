import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  source: string;

  @IsString()
  brandInterest: string;

  @IsOptional()
  @IsString()
  territoryId?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  currentStageId?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}
