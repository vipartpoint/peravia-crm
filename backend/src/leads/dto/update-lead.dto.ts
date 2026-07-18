import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  lostReason?: string;
  
  @IsOptional()
  @IsString()
  deleteReason?: string;
}
