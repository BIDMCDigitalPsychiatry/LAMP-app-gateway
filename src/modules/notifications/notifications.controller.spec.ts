import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { DispatcherService } from './dispatcher.service';
import { IDispatcherService } from './domain';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let dispatcherService: IDispatcherService;

  const mockDispatcherService = {
    sendDemoNote: jest.fn(),
    sendWelcomeNote: jest.fn(),
    sendActivityReminderNote: jest.fn(),
    sendMessageReceivedNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: DispatcherService,
          useValue: mockDispatcherService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    dispatcherService = module.get<IDispatcherService>(DispatcherService);
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
          { provide: DispatcherService, useValue: mockDispatcherService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

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
        controllers: [NotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

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
        controllers: [NotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

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
        controllers: [NotificationsController],
        providers: [
          { provide: DispatcherService, useValue: mockDispatcherService },
        ],
      }).compile();
      
      const testController = module.get<NotificationsController>(NotificationsController);

      await expect(testController.sendDemoFirebaseNote()).rejects.toThrow(
        'Cannot send Firebase demo notification if `DEMO_DEVICE_ID_ANDROID` is not set'
      );

      expect(mockDispatcherService.sendDemoNote).not.toHaveBeenCalled();

      process.env = originalEnv;
    });
  });

  describe('sendWelcomeNote', () => {
    it('should send welcome note via dispatcher', async () => {
      const payload = {
        destination: { service: 'firebase' as const, token: 'test-token' },
        options: {}
      };

      mockDispatcherService.sendWelcomeNote.mockResolvedValue(null);

      const result = await controller.sendWelcomeNote(payload);

      expect(mockDispatcherService.sendWelcomeNote).toHaveBeenCalledWith(
        payload.destination,
        payload.options
      );
      expect(result).toBe('ok');
    });
  });

  describe('sendActivityReminderNote', () => {
    it('should send activity reminder note via dispatcher', async () => {
      const payload = {
        destination: { service: 'apns' as const, token: 'test-token' },
        options: {}
      };

      mockDispatcherService.sendActivityReminderNote.mockResolvedValue(null);

      const result = await controller.sendActivityReminderNote(payload);

      expect(mockDispatcherService.sendActivityReminderNote).toHaveBeenCalledWith(
        payload.destination,
        payload.options
      );
      expect(result).toBe('ok');
    });
  });

  describe('sendMessageReceivedNote', () => {
    it('should send message received note via dispatcher', async () => {
      const payload = {
        destination: { service: 'firebase' as const, token: 'test-token' },
        options: {}
      };

      mockDispatcherService.sendMessageReceivedNote.mockResolvedValue(null);

      const result = await controller.sendMessageReceivedNote(payload);

      expect(mockDispatcherService.sendMessageReceivedNote).toHaveBeenCalledWith(
        payload.destination,
        payload.options
      );
      expect(result).toBe('ok');
    });
  });
});