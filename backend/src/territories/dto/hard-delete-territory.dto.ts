import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class HardDeleteTerritoryDto {
  @IsString()
  @IsNotEmpty({ message: 'adminPin is required for hard delete operation' })
  adminPin: string;

  @IsOptional()
  @IsString()
  replacementTerritoryId?: string;

  @IsOptional()
  @IsString()
  mode?: 'merge' | 'detach';
}
