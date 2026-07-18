import { IsString, IsOptional, IsUUID, IsBoolean, IsIn } from 'class-validator';

export class CreateTerritoryDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsIn(['Country', 'Province', 'City', 'SalesRegion', 'VisitRoute'])
  type: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}
