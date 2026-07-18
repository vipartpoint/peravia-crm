import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsString()
  brand: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  viscosityGrade?: string;

  @IsOptional()
  @IsString()
  apiStandard?: string;

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
