import { Test, TestingModule } from '@nestjs/testing';
import { DemoNotificationsController } from './demo-notifications.controller';
import { DispatcherService } from '../dispatcher.service';
import { AwsEndUserMessagingService, SIMULATOR_PHONE_NUMBERS } from '../providers/aws-end-user-messaging.service';
import { DemoNote } from '../messages/demo-note.dto';
import { AwsEmailService } from '../providers/aws-email.service';

describe('DemoNotificationsController', () => {
  let controller: DemoNotificationsController;

  const mockDispatcherService = {
    sendDemoNote: jest.fn(),
    sendWelcomeNote: jest.fn(),
    sendActivityReminderNote: jest.fn(),
    sendMessageReceivedNote: jest.fn(),
  };

  const mockSmsService = {
    sendMessage: jest.fn()
  }

  const mockEmailService = {
    sendMessage: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemoNotificationsController],
      providers: [
        {
          provide: DispatcherService,
          useValue: mockDispatcherService,
        },
        {
          provide: AwsEndUserMessagingService,
          useValue: mockSmsService
        },
        {
          provide: AwsEmailService,
          useValue: mockEmailService
        }
      ],
    }).compile();

    controller = module.get<DemoNotificationsController>(DemoNotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  
  describe('sendDemoApnsNote', () => {
    it('should send APNS notification when device ID is configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, DEMO_DEVICE_ID_IOS: 'test-ios-device-id' };
      
      // Need to recreate controller to pick up new env var
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DemoNotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
          { provide: AwsEndUserMessagingService, useValue: mockSmsService },
          { provide: AwsEmailService, useValue: mockEmailService },
        ],
      }).compile();
      
      const testController = module.get<DemoNotificationsController>(DemoNotificationsController);

      mockDispatcherService.sendDemoNote.mockResolvedValue(null);

      const result = await testController.sendDemoApnsNote();

      expect(mockDispatcherService.sendDemoNote).toHaveBeenCalledWith({
        service: 'apns',
        token: 'test-ios-device-id'
      });
      expect(result).toBe('ok');

      process.env = originalEnv;
    });

    it('should throw error when device ID is not configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.DEMO_DEVICE_ID_IOS;

      // Need to recreate controller to pick up env var change
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DemoNotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
          { provide: AwsEndUserMessagingService, useValue: mockSmsService },
          { provide: AwsEmailService, useValue: mockEmailService },
        ],
      }).compile();
      
      const testController = module.get<DemoNotificationsController>(DemoNotificationsController);

      await expect(testController.sendDemoApnsNote()).rejects.toThrow(
        'Cannot send APNs demo notification if `DEMO_DEVICE_ID_IOS` is not set'
      );

      expect(mockDispatcherService.sendDemoNote).not.toHaveBeenCalled();

      process.env = originalEnv;
    });
  });

  describe('sendDemoFirebaseNote', () => {
    it('should send Firebase notification when device ID is configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, DEMO_DEVICE_ID_ANDROID: 'test-android-device-id' };
      
      // Need to recreate controller to pick up new env var
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DemoNotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
          { provide: AwsEndUserMessagingService, useValue: mockSmsService },
          { provide: AwsEmailService, useValue: mockEmailService },
        ],
      }).compile();
      
      const testController = module.get<DemoNotificationsController>(DemoNotificationsController);

      mockDispatcherService.sendDemoNote.mockResolvedValue(null);

      const result = await testController.sendDemoFirebaseNote();

      expect(mockDispatcherService.sendDemoNote).toHaveBeenCalledWith({
        service: 'firebase',
        token: 'test-android-device-id'
      });
      expect(result).toBe('ok');

      process.env = originalEnv;
    });

    it('should throw error when device ID is not configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.DEMO_DEVICE_ID_ANDROID;

      // Need to recreate controller to pick up env var change
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DemoNotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
          { provide: AwsEndUserMessagingService, useValue: mockSmsService },
          { provide: AwsEmailService, useValue: mockEmailService },
        ],
      }).compile();
      
      const testController = module.get<DemoNotificationsController>(DemoNotificationsController);

      await expect(testController.sendDemoFirebaseNote()).rejects.toThrow(
        'Cannot send Firebase demo notification if `DEMO_DEVICE_ID_ANDROID` is not set'
      );

      expect(mockDispatcherService.sendDemoNote).not.toHaveBeenCalled();

      process.env = originalEnv;
    });
  });

  describe('sendDemoSmsNote', () => {
    it('should send SMS to simulator phone number with DemoNote', async () => {
      mockSmsService.sendMessage.mockResolvedValue(null);

      const result = await controller.sendDemoSmsNote();

      expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
        SIMULATOR_PHONE_NUMBERS.US.SUCCESS,
        expect.any(DemoNote)
      );
      expect(result).toBe('ok');
    });
  });

  describe('sendDemoEmailNote', () => {
    it('should send email when demo email addr is configured', async () => {
      const originalEnv = process.env;
      const demoEmailAddr = 'test123@example.com'
      process.env = { ...originalEnv, DEMO_EMAIL_ADDR: demoEmailAddr };
      
      // Need to recreate controller to pick up new env var
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DemoNotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
          { provide: AwsEndUserMessagingService, useValue: mockSmsService },
          { provide: AwsEmailService, useValue: mockEmailService },
        ],
      }).compile();
      
      const testController = module.get<DemoNotificationsController>(DemoNotificationsController);

      mockEmailService.sendMessage.mockResolvedValue(null);

      const result = await testController.sendDemoEmailNote();

      expect(mockEmailService.sendMessage).toHaveBeenCalledWith(demoEmailAddr, expect.any(DemoNote));
      expect(result).toBe('ok');

      process.env = originalEnv;
    });

    it('should throw error when device ID is not configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.DEMO_EMAIL_ADDR;

      // Need to recreate controller to pick up env var change
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DemoNotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
          { provide: AwsEndUserMessagingService, useValue: mockSmsService },
          { provide: AwsEmailService, useValue: mockEmailService },
        ],
      }).compile();
      
      const testController = module.get<DemoNotificationsController>(DemoNotificationsController);

      await expect(testController.sendDemoEmailNote()).rejects.toThrow(
        'Cannot send demo notification via email if `DEMO_EMAIL_ADDR` is not set'
      );

      expect(mockEmailService.sendMessage).not.toHaveBeenCalled();

      process.env = originalEnv;
    });
  });

});
