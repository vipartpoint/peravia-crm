import { PartialType } from '@nestjs/mapped-types';
import { CreateOpportunityDto } from './create-opportunity.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  lostReasonId?: string;

  @IsString()
  @IsOptional()
  lostReasonNote?: string;
  
  @IsString()
  @IsOptional()
  reopenReasonId?: string;

  @IsString()
  @IsOptional()
  reopenReasonNote?: string;
  
  @IsString()
  @IsOptional()
  reminderStatus?: string;

  @IsOptional()
  competitors?: { competitorId: string, isPrimary?: boolean, note?: string }[];
}
