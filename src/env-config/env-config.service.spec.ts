import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EnvConfigService } from './env-config.service'

describe('EnvConfigService', () => {
  let service: EnvConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvConfigService, ConfigService]
    }).compile()

    service = module.get<EnvConfigService>(EnvConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
