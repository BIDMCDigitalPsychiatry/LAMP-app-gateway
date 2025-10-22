import { Test, TestingModule } from '@nestjs/testing';
import { GenericPushNotificationsController } from './generic-push-notifications.controller';
import { DispatcherService } from '../dispatcher.service';

describe('GenericPushNotificationsController', () => {
  let controller: GenericPushNotificationsController;

  const mockDispatcherService = {
    sendDemoNote: jest.fn(),
    sendWelcomeNote: jest.fn(),
    sendActivityReminderNote: jest.fn(),
    sendMessageReceivedNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenericPushNotificationsController],
      providers: [
        {
          provide: DispatcherService,
          useValue: mockDispatcherService,
        },
      ],
    }).compile();

    controller = module.get<GenericPushNotificationsController>(GenericPushNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
