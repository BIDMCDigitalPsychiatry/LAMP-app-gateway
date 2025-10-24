import { Test, TestingModule } from '@nestjs/testing';
import { AwsEmailService, AwsEmailServiceConfig } from './aws-email.service';
import awsSesConfig from '../config/aws-ses.config';

describe('AwsEmailService', () => {
  let service: AwsEmailService;

  const mockAwsConfig: AwsEmailServiceConfig = {
    region: 'us-east-1',
    senderEmailAddress: 'test-sender@example.com',
    replyToAddress: 'test-replyto@example.com',
    templateSuffix: '-example'
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsEmailService,
        {
          provide: awsSesConfig.KEY,
          useValue: mockAwsConfig
        },
      ],
    }).compile();

    service = module.get<AwsEmailService>(AwsEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
