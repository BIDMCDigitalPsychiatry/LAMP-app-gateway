import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { ApplePushNotificationService } from './apple-push-notification.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let firebaseService: FirebaseMessagingService;
  let apnsService: ApplePushNotificationService;

  const mockFirebaseService = {
    sendDemoNotification: jest.fn(),
  };

  const mockApnsService = {
    sendDemoNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: FirebaseMessagingService,
          useValue: mockFirebaseService,
        },
        {
          provide: ApplePushNotificationService,
          useValue: mockApnsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    firebaseService = module.get<FirebaseMessagingService>(FirebaseMessagingService);
    apnsService = module.get<ApplePushNotificationService>(ApplePushNotificationService);
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
        controllers: [NotificationsController],
        providers: [
          { provide: FirebaseMessagingService, useValue: mockFirebaseService },
          { provide: ApplePushNotificationService, useValue: mockApnsService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

      mockApnsService.sendDemoNotification.mockResolvedValue(null);

      const result = await testController.sendDemoApnsNote();

      expect(mockApnsService.sendDemoNotification).toHaveBeenCalledWith('test-ios-device-id');
      expect(result).toBe('ok');

      process.env = originalEnv;
    });

    it('should throw 403 error when device ID is not configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.DEMO_DEVICE_ID_IOS;

      // Need to recreate controller to pick up env var change
      const module: TestingModule = await Test.createTestingModule({
        controllers: [NotificationsController],
        providers: [
          { provide: FirebaseMessagingService, useValue: mockFirebaseService },
          { provide: ApplePushNotificationService, useValue: mockApnsService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

      await expect(testController.sendDemoApnsNote()).rejects.toThrow(
        new HttpException('DEMO_DEVICE_ID_IOS not configured', HttpStatus.FORBIDDEN)
      );

      expect(mockApnsService.sendDemoNotification).not.toHaveBeenCalled();

      process.env = originalEnv;
    });
  });

  describe('sendDemoFirebaseNote', () => {
    it('should send Firebase notification when device ID is configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, DEMO_DEVICE_ID_ANDROID: 'test-android-device-id' };
      
      // Need to recreate controller to pick up new env var
      const module: TestingModule = await Test.createTestingModule({
        controllers: [NotificationsController],
        providers: [
          { provide: FirebaseMessagingService, useValue: mockFirebaseService },
          { provide: ApplePushNotificationService, useValue: mockApnsService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

      mockFirebaseService.sendDemoNotification.mockResolvedValue('message-id-123');

      const result = await testController.sendDemoFirebaseNote();

      expect(mockFirebaseService.sendDemoNotification).toHaveBeenCalledWith('test-android-device-id');
      expect(result).toBe('ok');

      process.env = originalEnv;
    });

    it('should throw 403 error when device ID is not configured', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.DEMO_DEVICE_ID_ANDROID;

      // Need to recreate controller to pick up env var change
      const module: TestingModule = await Test.createTestingModule({
        controllers: [NotificationsController],
        providers: [
          { provide: FirebaseMessagingService, useValue: mockFirebaseService },
          { provide: ApplePushNotificationService, useValue: mockApnsService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

      await expect(testController.sendDemoFirebaseNote()).rejects.toThrow(
        new HttpException('DEMO_DEVICE_ID_ANDROID not configured', HttpStatus.FORBIDDEN)
      );

      expect(mockFirebaseService.sendDemoNotification).not.toHaveBeenCalled();

      process.env = originalEnv;
    });
  });
});