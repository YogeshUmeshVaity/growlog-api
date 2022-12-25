import { Module } from '@nestjs/common'
import { EnvConfigService } from '../env-config/env-config.service'
import { EmailService } from './email.service'

@Module({
  imports: [],
  providers: [EmailService, EnvConfigService],
  exports: [EmailService]
})
export class EmailServiceModule {}
