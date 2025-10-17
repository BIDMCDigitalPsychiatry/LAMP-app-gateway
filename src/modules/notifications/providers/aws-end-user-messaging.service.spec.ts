import { Test, TestingModule } from '@nestjs/testing';
import { AwsEndUserMessagingService } from './aws-end-user-messaging.service';

describe('AwsEndUserMessagingService', () => {
  let service: AwsEndUserMessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsEndUserMessagingService],
    }).compile();

    service = module.get<AwsEndUserMessagingService>(AwsEndUserMessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
