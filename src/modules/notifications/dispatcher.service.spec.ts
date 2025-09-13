import { Test, TestingModule } from '@nestjs/testing';
import { IDispatcherService } from './domain';
import { DispatcherService } from './dispatcher.service';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';

describe('DispatcherService', () => {
  let service: IDispatcherService;

  const mockFirebaseService = {
    sendMessage: jest.fn(),
  };

  const mockApnsService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatcherService,
        {
          provide: FirebaseMessagingService,
          useValue: mockFirebaseService,
        },
        {
          provide: ApplePushNotificationService,
          useValue: mockApnsService,
        },
      ],
    }).compile();

    service = module.get<IDispatcherService>(DispatcherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendDemoNote', () => {
    it('should send demo note via APNS', async () => {
      const destination = { service: 'apns' as const, token: 'test-token' };
      
      await service.sendDemoNote(destination);
      
      expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send demo note via Firebase', async () => {
      const destination = { service: 'firebase' as const, token: 'test-token' };
      
      await service.sendDemoNote(destination);
      
      expect(mockFirebaseService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });
  });

  describe('sendWelcomeNote', () => {
    it('should send welcome note via APNS', async () => {
      const destination = { service: 'apns' as const, token: 'test-token' };
      const params = {};
      
      await service.sendWelcomeNote(destination, params);
      
      expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send welcome note via Firebase', async () => {
      const destination = { service: 'firebase' as const, token: 'test-token' };
      const params = {};
      
      await service.sendWelcomeNote(destination, params);
      
      expect(mockFirebaseService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });
  });

  describe('sendActivityReminderNote', () => {
    it('should send activity reminder note via APNS', async () => {
      const destination = { service: 'apns' as const, token: 'test-token' };
      const params = {};
      
      await service.sendActivityReminderNote(destination, params);
      
      expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send activity reminder note via Firebase', async () => {
      const destination = { service: 'firebase' as const, token: 'test-token' };
      const params = {};
      
      await service.sendActivityReminderNote(destination, params);
      
      expect(mockFirebaseService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });
  });

  describe('sendMessageReceivedNote', () => {
    it('should send message received note via APNS', async () => {
      const destination = { service: 'apns' as const, token: 'test-token' };
      const params = {};
      
      await service.sendMessageReceivedNote(destination, params);
      
      expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send message received note via Firebase', async () => {
      const destination = { service: 'firebase' as const, token: 'test-token' };
      const params = {};
      
      await service.sendMessageReceivedNote(destination, params);
      
      expect(mockFirebaseService.sendMessage).toHaveBeenCalledWith(
        destination, 
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });
  });
});
