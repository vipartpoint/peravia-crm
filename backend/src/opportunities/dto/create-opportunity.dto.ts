import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OpportunityItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  potentialVolume?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;
}

export class CreateOpportunityDto {
  @IsString()
  name: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsUUID()
  @IsOptional()
  territoryId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsNumber()
  @IsOptional()
  probability?: number;

  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  salesStage?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  lostReason?: string;

  @IsDateString()
  @IsOptional()
  lostAt?: string;

  @IsString()
  @IsOptional()
  competitorName?: string;

  @IsString()
  @IsOptional()
  competitorNotes?: string;

  @IsString()
  @IsOptional()
  nextAction?: string;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunityItemDto)
  @IsOptional()
  items?: OpportunityItemDto[];
}
