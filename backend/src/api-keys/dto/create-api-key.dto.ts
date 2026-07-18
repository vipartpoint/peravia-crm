import { IsString, IsArray, IsOptional, IsDateString, ArrayNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
