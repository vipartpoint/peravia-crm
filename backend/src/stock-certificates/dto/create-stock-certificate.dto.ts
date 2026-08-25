import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockCertificateDto {
  @IsString()
  @IsNotEmpty()
  shareholderName: string;

  @IsString()
  @IsNotEmpty()
  fatherName: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  sharesCount: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  shareValue: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  totalAmount: number;

  @IsString()
  @IsNotEmpty()
  amountInWords: string;

  @IsNumber()
  @Type(() => Number)
  shareRangeFrom: number;

  @IsNumber()
  @Type(() => Number)
  shareRangeTo: number;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  registrationDate?: string;

  @IsString()
  @IsNotEmpty()
  registrationLocation: string;

  @IsString()
  @IsNotEmpty()
  registeredCapital: string;
}
