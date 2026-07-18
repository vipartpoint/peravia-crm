import { IsString, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';

export class CreatePresentationDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  presentationType: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  customerReaction?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rejectionReasons?: string[];

  @IsOptional()
  @IsString()
  competitorName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}
