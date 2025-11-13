import { Test, TestingModule } from '@nestjs/testing';
import { OtpStorageService } from './otp-storage.service';
import dynamoOtpConfig from '../../config/dynamo-otp.config';

describe('OtpStorageService', () => {
  let service: OtpStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpStorageService,
        {
          provide: dynamoOtpConfig.KEY,
          useValue: {
            region: 'us-east-2',
            table: 'test-otp-table',
          },
        },
      ],
    }).compile();

    service = module.get<OtpStorageService>(OtpStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
