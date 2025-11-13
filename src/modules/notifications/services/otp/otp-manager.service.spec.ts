import { Test, TestingModule } from '@nestjs/testing';
import { OtpManagerService } from './otp-manager.service';
import { AwsEndUserMessagingService } from '../../providers/aws-end-user-messaging.service';
import { AwsEmailService } from '../../providers/aws-email.service';
import { OtpService } from './otp.service';
import { OtpStorageService } from './otp-storage.service';

describe('OtpManagerService', () => {
  let service: OtpManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpManagerService,
        {
          provide: AwsEndUserMessagingService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
        {
          provide: AwsEmailService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateOneTimePassword: jest.fn(),
            verifyOneTimePassword: jest.fn(),
          },
        },
        {
          provide: OtpStorageService,
          useValue: {
            fetch: jest.fn(),
            save: jest.fn(),
            removeAllFor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OtpManagerService>(OtpManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
