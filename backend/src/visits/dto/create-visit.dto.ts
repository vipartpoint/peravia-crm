import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateVisitDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  territoryId?: string;

  @IsString()
  visitType: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  gpsLong?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
