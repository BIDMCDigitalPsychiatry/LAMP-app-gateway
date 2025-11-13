import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import * as argon2 from 'argon2';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOneTimePassword', () => {
    it('should generate a 6-digit OTP code', async () => {
      const result = await service.generateOneTimePassword();

      expect(result.code).toMatch(/^\d{6}$/);
    });

    it('should generate a hash for the code', async () => {
      const result = await service.generateOneTimePassword();

      expect(result.hash).toBeDefined();
      expect(typeof result.hash).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
    });

    it('should generate an expiration time 15 minutes in the future', async () => {
      const beforeGeneration = Date.now();
      const result = await service.generateOneTimePassword();
      const afterGeneration = Date.now();

      const expectedMinExp = beforeGeneration + 15 * 60 * 1000;
      const expectedMaxExp = afterGeneration + 15 * 60 * 1000;

      expect(result.exp).toBeGreaterThanOrEqual(expectedMinExp);
      expect(result.exp).toBeLessThanOrEqual(expectedMaxExp);
    });

    it('should generate unique codes on subsequent calls', async () => {
      const results = await Promise.all([
        service.generateOneTimePassword(),
        service.generateOneTimePassword(),
        service.generateOneTimePassword(),
      ]);

      const codes = results.map(r => r.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBeGreaterThan(1);
    });
  });

  describe('verifyOneTimePassword', () => {
    it('should return true when candidate matches the hash', async () => {
      const { code, hash } = await service.generateOneTimePassword();

      const result = await service.verifyOneTimePassword(code, hash);

      expect(result).toBe(true);
    });

    it('should return false when candidate does not match the hash', async () => {
      const { hash } = await service.generateOneTimePassword();
      const wrongCode = '999999';

      const result = await service.verifyOneTimePassword(wrongCode, hash);

      expect(result).toBe(false);
    });

    it('should return false when hash is invalid', async () => {
      const result = await service.verifyOneTimePassword('123456', 'invalid-hash');

      expect(result).toBe(false);
    });

  });
});
