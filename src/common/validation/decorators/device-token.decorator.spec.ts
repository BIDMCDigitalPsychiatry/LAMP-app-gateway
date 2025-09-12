import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { IsApnsDeviceToken, IsFirebaseDeviceToken, IsDeviceToken } from './device-token.decorator';
import { IsIn } from 'class-validator';

class TestApnsDto {
  @IsApnsDeviceToken()
  token!: string;
}

class TestFirebaseDto {
  @IsFirebaseDeviceToken()
  token!: string;
}

class TestDynamicDto {
  @IsIn(['apns', 'firebase'])
  tokenType!: 'apns' | 'firebase';

  @IsDeviceToken()
  deviceToken!: string;
}

describe('Device Token Validation Decorators', () => {
  describe('@IsApnsDeviceToken', () => {
    it('should validate valid APNs tokens', async () => {
      const validTokens = [
        'a1b2c3d4e5f6', // Minimum length (8 chars)
        'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234', // Common length (64 chars)
        'ABCDEF1234567890', // Uppercase hex
        '1234567890abcdef', // Lowercase hex
        'A'.repeat(512), // Maximum length
      ];

      for (const token of validTokens) {
        const dto = plainToClass(TestApnsDto, { token });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid APNs tokens', async () => {
      const invalidTokens = [
        'short', // Too short (< 8 chars)
        'not-hex-string', // Contains non-hex characters
        'a1b2c3d4e5f6g7h8', // Contains invalid hex character 'g' and 'h'
        'A'.repeat(513), // Too long (> 512 chars)
        '', // Empty string
        '12345+67890abcdef', // Contains non-hex character '+'
      ];

      for (const token of invalidTokens) {
        const dto = plainToClass(TestApnsDto, { token });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toHaveProperty('constraints.isApnsDeviceToken');
      }
    });
  });

  describe('@IsFirebaseDeviceToken', () => {
    it('should validate valid Firebase tokens', async () => {
      const validTokens = [
        'a'.repeat(140), // Minimum length
        'A'.repeat(150) + '-' + '_'.repeat(50), // With valid base64url chars
        'eEAR1YiGTkS_long_base64url_encoded_token_here_with_various_characters_to_meet_minimum_length_requirement_for_firebase_tokens_which_are_typically_140_plus_characters_long',
      ];

      for (const token of validTokens) {
        const dto = plainToClass(TestFirebaseDto, { token });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject invalid Firebase tokens', async () => {
      const invalidTokens = [
        'short', // Too short (< 140 chars)
        'a'.repeat(140) + '+', // Contains invalid base64url character '+'
        'a'.repeat(140) + '/', // Contains invalid base64url character '/'
        'a'.repeat(140) + '=', // Contains invalid base64url character '='
        '', // Empty string
        'a'.repeat(139), // Just under minimum length
      ];

      for (const token of invalidTokens) {
        const dto = plainToClass(TestFirebaseDto, { token });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toHaveProperty('constraints.isFirebaseDeviceToken');
      }
    });
  });

  describe('@IsDeviceToken (dynamic)', () => {
    it('should validate APNs tokens when tokenType is apns', async () => {
      const dto = plainToClass(TestDynamicDto, {
        tokenType: 'apns',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234',
      });
      
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate Firebase tokens when tokenType is firebase', async () => {
      const dto = plainToClass(TestDynamicDto, {
        tokenType: 'firebase',
        deviceToken: 'eEAR1YiGTkS_long_base64url_encoded_token_here_with_various_characters_to_meet_minimum_length_requirement_for_firebase_tokens_which_are_typically_140_plus_characters_long',
      });
      
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject APNs token with firebase tokenType', async () => {
      const dto = plainToClass(TestDynamicDto, {
        tokenType: 'firebase',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234', // Valid APNs, invalid for Firebase
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints?.isDeviceToken).toContain('Firebase device token');
    });

    it('should reject Firebase token with apns tokenType', async () => {
      const dto = plainToClass(TestDynamicDto, {
        tokenType: 'apns',
        deviceToken: 'a'.repeat(150), // Valid Firebase format, invalid for APNs
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints?.isDeviceToken).toContain('APNs device token');
    });

    it('should handle missing tokenType', async () => {
      const dto = plainToClass(TestDynamicDto, {
        // Missing tokenType
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234',
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // Should have error for missing tokenType and invalid deviceToken validation
      expect(errors.some(e => e.property === 'tokenType')).toBe(true);
    });
  });
});