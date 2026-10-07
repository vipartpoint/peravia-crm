import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateAdminPinDto {
  @IsString()
  @IsNotEmpty({ message: 'رمز کلیدی فعلی الزامی است' })
  currentPin: string;

  @IsString()
  @IsNotEmpty({ message: 'رمز کلیدی جدید الزامی است' })
  @MinLength(4, { message: 'رمز کلیدی جدید باید حداقل ۴ رقم یا کاراکتر باشد' })
  newPin: string;
}
