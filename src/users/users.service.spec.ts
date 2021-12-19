import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../auth/auth.service'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let repository: UsersRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue({}),
            findByName: jest.fn().mockResolvedValue({}),
            createAndSave: jest.fn().mockResolvedValue({})
          }
        },
        {
          provide: AuthService,
          useValue: {}
        }
      ]
    }).compile()

    service = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
