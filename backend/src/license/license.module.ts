import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
