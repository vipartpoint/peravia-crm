import { IsString, IsOptional, IsBoolean, IsDateString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceListItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsNumber()
  finalPrice: number;
}

export class CreatePriceListDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsString()
  type: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemDto)
  items: PriceListItemDto[];
}
