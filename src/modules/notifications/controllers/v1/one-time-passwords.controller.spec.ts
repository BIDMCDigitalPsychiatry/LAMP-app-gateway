import { Test, TestingModule } from '@nestjs/testing';
import { OneTimePasswordsController } from './one-time-passwords.controller';
import { OtpManagerService } from '../../services/one-time-password/otp-manager.service';

describe('OneTimePasswordsController', () => {
  let controller: OneTimePasswordsController;

  const mockOtpManagerService = {
    sendOneTimePasswordViaEmail: jest.fn(),
    sendOneTimePasswordViaSms: jest.fn(),
    validateOneTimePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OneTimePasswordsController],
      providers: [
        {
          provide: OtpManagerService,
          useValue: mockOtpManagerService,
        },
      ],
    }).compile();

    controller = module.get<OneTimePasswordsController>(OneTimePasswordsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendOtpViaEmail', () => {
    it('should send OTP via email and return ok', async () => {
      const payload = { email: 'test@example.com' };
      mockOtpManagerService.sendOneTimePasswordViaEmail.mockResolvedValue(undefined);

      const result = await controller.sendOtpViaEmail(payload);

      expect(mockOtpManagerService.sendOneTimePasswordViaEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe('ok');
    });
  });

  describe('sendOtpViaTextMessage', () => {
    it('should send OTP via SMS and return ok', async () => {
      const payload = { phoneNumber: '+12345678901' };
      mockOtpManagerService.sendOneTimePasswordViaSms.mockResolvedValue(undefined);

      const result = await controller.sendOtpViaTextMessage(payload);

      expect(mockOtpManagerService.sendOneTimePasswordViaSms).toHaveBeenCalledWith('+12345678901');
      expect(result).toBe('ok');
    });
  });

  describe('verifyOtp', () => {
    it('should return ok when OTP is valid', async () => {
      const payload = { identifier: 'test@example.com', code: '123456' };
      mockOtpManagerService.validateOneTimePassword.mockResolvedValue(true);

      const result = await controller.verifyOtp(payload);

      expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('test@example.com', '123456');
      expect(result).toBe('ok');
    });

    it('should return fail when OTP is invalid', async () => {
      const payload = { identifier: '+12345678901', code: '999999' };
      mockOtpManagerService.validateOneTimePassword.mockResolvedValue(false);

      const result = await controller.verifyOtp(payload);

      expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('+12345678901', '999999');
      expect(result).toBe('fail');
    });
  });
});
