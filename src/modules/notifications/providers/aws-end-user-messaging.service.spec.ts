import { Test, TestingModule } from '@nestjs/testing';
import { AwsEndUserMessagingService, AwsEndUserMessagingConfig } from './aws-end-user-messaging.service';
import awsSmsConfig from '../config/aws-sms.config';

describe('AwsEndUserMessagingService', () => {
  let service: AwsEndUserMessagingService;

  const mockAwsConfig: AwsEndUserMessagingConfig = {
    configSetName: 'test-config-set',
    originationIdentity: 'test-pool-id',
    region: 'us-east-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsEndUserMessagingService,
        {
          provide: awsSmsConfig.KEY,
          useValue: mockAwsConfig,
        },
      ],
    }).compile();

    service = module.get<AwsEndUserMessagingService>(AwsEndUserMessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
