import { Test, TestingModule } from '@nestjs/testing';
import { OneTimePasswordsController } from './one-time-passwords.controller';
import { OtpManagerService } from '../services/otp/otp-manager.service';

describe('OneTimePasswordsController', () => {
  let controller: OneTimePasswordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OneTimePasswordsController],
      providers: [
        {
          provide: OtpManagerService,
          useValue: {
            sendOneTimePasswordViaEmail: jest.fn(),
            sendOneTimePasswordViaSms: jest.fn(),
            validateOneTimePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OneTimePasswordsController>(OneTimePasswordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
