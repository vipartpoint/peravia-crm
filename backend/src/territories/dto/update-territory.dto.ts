import { PartialType } from '@nestjs/mapped-types';
import { CreateTerritoryDto } from './create-territory.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTerritoryDto extends PartialType(CreateTerritoryDto) {
  @IsOptional()
  @IsString()
  deleteReason?: string;
}
