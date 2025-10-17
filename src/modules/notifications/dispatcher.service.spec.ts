import { Test, TestingModule } from '@nestjs/testing';
import { IDispatcherService } from './domain';
import { DispatcherService } from './dispatcher.service';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { AwsEndUserMessagingService } from './providers/aws-end-user-messaging.service';
import { AwsSesService } from './providers/aws-ses.service';

describe('DispatcherService', () => {
  let service: IDispatcherService;

  const mockFirebaseService = {
    sendMessage: jest.fn(),
  };

  const mockApnsService = {
    sendMessage: jest.fn(),
  };

  const mockSmsService = {
    sendMessage: jest.fn(),
  };

  const mockEmailService = {
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
        {
          provide: AwsEndUserMessagingService,
          useValue: mockSmsService,
        },
        {
          provide: AwsSesService,
          useValue: mockEmailService,
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

    it('should send demo note via SMS', async () => {
      const destination = { service: 'sms' as const, phoneNumber: '+1234567890' };

      await service.sendDemoNote(destination);

      expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
        destination,
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send demo note via Email', async () => {
      const destination = { service: 'email' as const, email: 'test@example.com' };

      await service.sendDemoNote(destination);

      expect(mockEmailService.sendMessage).toHaveBeenCalledWith(
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

    it('should send welcome note via SMS', async () => {
      const destination = { service: 'sms' as const, phoneNumber: '+1234567890' };
      const params = {};

      await service.sendWelcomeNote(destination, params);

      expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
        destination,
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send welcome note via Email', async () => {
      const destination = { service: 'email' as const, email: 'test@example.com' };
      const params = {};

      await service.sendWelcomeNote(destination, params);

      expect(mockEmailService.sendMessage).toHaveBeenCalledWith(
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

    it('should send activity reminder note via SMS', async () => {
      const destination = { service: 'sms' as const, phoneNumber: '+1234567890' };
      const params = {};

      await service.sendActivityReminderNote(destination, params);

      expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
        destination,
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send activity reminder note via Email', async () => {
      const destination = { service: 'email' as const, email: 'test@example.com' };
      const params = {};

      await service.sendActivityReminderNote(destination, params);

      expect(mockEmailService.sendMessage).toHaveBeenCalledWith(
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

    it('should send message received note via SMS', async () => {
      const destination = { service: 'sms' as const, phoneNumber: '+1234567890' };
      const params = {};

      await service.sendMessageReceivedNote(destination, params);

      expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
        destination,
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });

    it('should send message received note via Email', async () => {
      const destination = { service: 'email' as const, email: 'test@example.com' };
      const params = {};

      await service.sendMessageReceivedNote(destination, params);

      expect(mockEmailService.sendMessage).toHaveBeenCalledWith(
        destination,
        expect.objectContaining({
          title: expect.any(String),
          body: expect.any(String),
        })
      );
    });
  });
});
