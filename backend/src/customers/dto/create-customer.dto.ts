import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  customerType: string;

  @IsString()
  @IsNotEmpty()
  brandScope: string;

  @IsString()
  @IsNotEmpty()
  loyaltyTier: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  territoryId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  assignedUserId?: string;
}
