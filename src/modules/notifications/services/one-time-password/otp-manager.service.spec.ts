import { Test, TestingModule } from '@nestjs/testing';
import { OtpManagerService } from './otp-manager.service';
import { AwsEndUserMessagingService } from '../../providers/aws-end-user-messaging.service';
import { AwsEmailService } from '../../providers/aws-email.service';
import { OtpService } from './otp.service';
import { OtpStorageService } from './otp-storage.service';
import { OneTimePasswordNote } from '../../messages/one-time-password-note.dto';

describe('OtpManagerService', () => {
  let service: OtpManagerService;

  const mockSmsService = {
    sendMessage: jest.fn(),
  };

  const mockEmailService = {
    sendMessage: jest.fn(),
  };

  const mockOtpService = {
    generateOneTimePassword: jest.fn(),
    verifyOneTimePassword: jest.fn(),
  };

  const mockOtpStorageService = {
    fetch: jest.fn(),
    save: jest.fn(),
    removeAllFor: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpManagerService,
        {
          provide: AwsEndUserMessagingService,
          useValue: mockSmsService,
        },
        {
          provide: AwsEmailService,
          useValue: mockEmailService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: OtpStorageService,
          useValue: mockOtpStorageService,
        },
      ],
    }).compile();

    service = module.get<OtpManagerService>(OtpManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOneTimePasswordViaSms', () => {
    it('should generate OTP, store it, and send via SMS', async () => {
      const phoneNumber = '+12345678901';
      const code = '123456';
      const hash = 'test-hash';
      const exp = Date.now() + 15 * 60 * 1000;

      mockOtpService.generateOneTimePassword.mockResolvedValue({ code, hash, exp });
      mockOtpStorageService.removeAllFor.mockResolvedValue(undefined);
      mockOtpStorageService.save.mockResolvedValue(undefined);
      mockSmsService.sendMessage.mockResolvedValue(undefined);

      await service.sendOneTimePasswordViaSms(phoneNumber);

      expect(mockOtpService.generateOneTimePassword).toHaveBeenCalled();
      expect(mockOtpStorageService.removeAllFor).toHaveBeenCalledWith(phoneNumber);
      expect(mockOtpStorageService.save).toHaveBeenCalledWith(phoneNumber, hash, exp);
      expect(mockSmsService.sendMessage).toHaveBeenCalledWith(phoneNumber, expect.any(OneTimePasswordNote));

      const sentNote = mockSmsService.sendMessage.mock.calls[0][1];
      expect(sentNote.body).toContain(code);
    });

    it('should remove old OTPs before issuing new one', async () => {
      const phoneNumber = '+12345678901';
      const code = '654321';
      const hash = 'new-hash';
      const exp = Date.now() + 15 * 60 * 1000;

      mockOtpService.generateOneTimePassword.mockResolvedValue({ code, hash, exp });
      mockOtpStorageService.removeAllFor.mockResolvedValue(undefined);
      mockOtpStorageService.save.mockResolvedValue(undefined);
      mockSmsService.sendMessage.mockResolvedValue(undefined);

      await service.sendOneTimePasswordViaSms(phoneNumber);

      const callOrder = [];
      for (const call of mockOtpStorageService.removeAllFor.mock.invocationCallOrder) {
        callOrder.push({ type: 'removeAllFor', order: call });
      }
      for (const call of mockOtpStorageService.save.mock.invocationCallOrder) {
        callOrder.push({ type: 'save', order: call });
      }

      callOrder.sort((a, b) => a.order - b.order);
      expect(callOrder[0]?.type).toBe('removeAllFor');
      expect(callOrder[1]?.type).toBe('save');
    });
  });

  describe('sendOneTimePasswordViaEmail', () => {
    it('should generate OTP, store it, and send via email', async () => {
      const email = 'test@example.com';
      const code = '789012';
      const hash = 'email-hash';
      const exp = Date.now() + 15 * 60 * 1000;

      mockOtpService.generateOneTimePassword.mockResolvedValue({ code, hash, exp });
      mockOtpStorageService.removeAllFor.mockResolvedValue(undefined);
      mockOtpStorageService.save.mockResolvedValue(undefined);
      mockEmailService.sendMessage.mockResolvedValue(undefined);

      await service.sendOneTimePasswordViaEmail(email);

      expect(mockOtpService.generateOneTimePassword).toHaveBeenCalled();
      expect(mockOtpStorageService.removeAllFor).toHaveBeenCalledWith(email);
      expect(mockOtpStorageService.save).toHaveBeenCalledWith(email, hash, exp);
      expect(mockEmailService.sendMessage).toHaveBeenCalledWith(email, expect.any(OneTimePasswordNote));

      const sentNote = mockEmailService.sendMessage.mock.calls[0][1];
      expect(sentNote.body).toContain(code);
    });

    it('should remove old OTPs before issuing new one', async () => {
      const email = 'test@example.com';
      const code = '111111';
      const hash = 'new-email-hash';
      const exp = Date.now() + 15 * 60 * 1000;

      mockOtpService.generateOneTimePassword.mockResolvedValue({ code, hash, exp });
      mockOtpStorageService.removeAllFor.mockResolvedValue(undefined);
      mockOtpStorageService.save.mockResolvedValue(undefined);
      mockEmailService.sendMessage.mockResolvedValue(undefined);

      await service.sendOneTimePasswordViaEmail(email);

      const callOrder = [];
      for (const call of mockOtpStorageService.removeAllFor.mock.invocationCallOrder) {
        callOrder.push({ type: 'removeAllFor', order: call });
      }
      for (const call of mockOtpStorageService.save.mock.invocationCallOrder) {
        callOrder.push({ type: 'save', order: call });
      }

      callOrder.sort((a, b) => a.order - b.order);
      expect(callOrder[0]?.type).toBe('removeAllFor');
      expect(callOrder[1]?.type).toBe('save');
    });
  });

  describe('validateOneTimePassword', () => {
    it('should return true and clean up when OTP is valid', async () => {
      const identifier = 'test@example.com';
      const candidate = '123456';
      const storedHash = 'stored-hash';

      mockOtpStorageService.fetch.mockResolvedValue(storedHash);
      mockOtpService.verifyOneTimePassword.mockResolvedValue(true);
      mockOtpStorageService.removeAllFor.mockResolvedValue(undefined);

      const result = await service.validateOneTimePassword(identifier, candidate);

      expect(mockOtpStorageService.fetch).toHaveBeenCalledWith(identifier);
      expect(mockOtpService.verifyOneTimePassword).toHaveBeenCalledWith(candidate, storedHash);
      expect(mockOtpStorageService.removeAllFor).toHaveBeenCalledWith(identifier);
      expect(result).toBe(true);
    });

    it('should return false when OTP does not match', async () => {
      const identifier = '+12345678901';
      const candidate = '999999';
      const storedHash = 'stored-hash';

      mockOtpStorageService.fetch.mockResolvedValue(storedHash);
      mockOtpService.verifyOneTimePassword.mockResolvedValue(false);

      const result = await service.validateOneTimePassword(identifier, candidate);

      expect(mockOtpStorageService.fetch).toHaveBeenCalledWith(identifier);
      expect(mockOtpService.verifyOneTimePassword).toHaveBeenCalledWith(candidate, storedHash);
      expect(mockOtpStorageService.removeAllFor).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false when no OTP exists for identifier', async () => {
      const identifier = 'nonexistent@example.com';
      const candidate = '123456';

      mockOtpStorageService.fetch.mockResolvedValue(undefined);

      const result = await service.validateOneTimePassword(identifier, candidate);

      expect(mockOtpStorageService.fetch).toHaveBeenCalledWith(identifier);
      expect(mockOtpService.verifyOneTimePassword).not.toHaveBeenCalled();
      expect(mockOtpStorageService.removeAllFor).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should not clean up when OTP verification fails', async () => {
      const identifier = 'test@example.com';
      const candidate = '111111';
      const storedHash = 'stored-hash';

      mockOtpStorageService.fetch.mockResolvedValue(storedHash);
      mockOtpService.verifyOneTimePassword.mockResolvedValue(false);

      await service.validateOneTimePassword(identifier, candidate);

      expect(mockOtpStorageService.removeAllFor).not.toHaveBeenCalled();
    });
  });
});
