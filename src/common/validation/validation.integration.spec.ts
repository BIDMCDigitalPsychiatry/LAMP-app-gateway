import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

// Import DTOs to test
import {
  SendNoteRequest,
  SendGenericWelcomeNoteRequest,
  SendGenericActivityReminderRequest,
  SendGenericNewMessageNoteRequest
} from '../../modules/notifications/dto';

describe('Validation Integration Tests', () => {
  let validationPipe: ValidationPipe;

  beforeEach(async () => {
    // Create ValidationPipe with same configuration as main.ts
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });
  });

  describe('SendNoteRequest validation', () => {
    it('should validate valid APNs device token', async () => {
      const validPayload = {
        tokenType: 'apns',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234',
      };

      const dto = plainToClass(SendNoteRequest, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate valid Firebase device token', async () => {
      const validPayload = {
        tokenType: 'firebase',
        deviceToken: 'eEAR1YiGTkS_long_base64url_encoded_token_here_with_various_characters_to_meet_minimum_length_requirement_for_firebase_tokens_which_are_typically_140_plus_characters_long',
      };

      const dto = plainToClass(SendNoteRequest, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject invalid APNs device token', async () => {
      const invalidPayload = {
        tokenType: 'apns',
        deviceToken: 'not-a-hex-string', // Invalid: contains non-hex characters
      };

      const dto = plainToClass(SendNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints!.isDeviceToken).toContain('must be a valid APNs device token');
    });

    it('should reject invalid Firebase device token', async () => {
      const invalidPayload = {
        tokenType: 'firebase',
        deviceToken: 'too-short', // Invalid: too short for Firebase token
      };

      const dto = plainToClass(SendNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints!.isDeviceToken).toContain('must be a valid Firebase device token');
    });

    it('should reject invalid tokenType', async () => {
      const invalidPayload = {
        tokenType: 'invalid-type',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234',
      };

      const dto = plainToClass(SendNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints!.isIn).toContain('tokenType must be either');
    });

    it('should reject missing required fields', async () => {
      const incompletePayload = {
        tokenType: 'apns',
        // missing deviceToken
      };

      const dto = plainToClass(SendNoteRequest, incompletePayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeDefined();
      expect(errors[0].property).toBe('deviceToken');
    });
  });

  describe('SendGenericActivityReminderRequest validation', () => {
    it('should validate with all fields present', async () => {
      const validPayload = {
        tokenType: 'apns',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234',
        activityName: 'Morning Meditation',
        activityId: 'meditation_001',
      };

      const dto = plainToClass(SendGenericActivityReminderRequest, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate with only required fields (PartialType)', async () => {
      const minimalPayload = {
        // All fields are optional due to PartialType
      };

      const dto = plainToClass(SendGenericActivityReminderRequest, minimalPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject activityName that is too long', async () => {
      const invalidPayload = {
        activityName: 'a'.repeat(101), // Exceeds 100 character limit
      };

      const dto = plainToClass(SendGenericActivityReminderRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints!.maxLength).toContain('must not exceed 100 characters');
    });

    it('should reject activityId that is too long', async () => {
      const invalidPayload = {
        activityId: 'a'.repeat(51), // Exceeds 50 character limit
      };

      const dto = plainToClass(SendGenericActivityReminderRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints!.maxLength).toContain('must not exceed 50 characters');
    });

    it('should reject non-string activity fields', async () => {
      const invalidPayload = {
        activityName: 123, // Should be string
        activityId: true,  // Should be string
      };

      const dto = plainToClass(SendGenericActivityReminderRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'activityName' && e.constraints?.isString)).toBe(true);
      expect(errors.some(e => e.property === 'activityId' && e.constraints?.isString)).toBe(true);
    });
  });

  describe('SendGenericNewMessageNoteRequest validation', () => {
    it('should validate with senderName present', async () => {
      const validPayload = {
        tokenType: 'firebase',
        deviceToken: 'eEAR1YiGTkS_long_base64url_encoded_token_here_with_various_characters_to_meet_minimum_length_requirement_for_firebase_tokens_which_are_typically_140_plus_characters_long',
        senderName: 'Dr. Smith',
      };

      const dto = plainToClass(SendGenericNewMessageNoteRequest, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject senderName that is too long', async () => {
      const invalidPayload = {
        senderName: 'a'.repeat(101), // Exceeds 100 character limit
      };

      const dto = plainToClass(SendGenericNewMessageNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints!.maxLength).toContain('must not exceed 100 characters');
    });

    it('should reject non-string senderName', async () => {
      const invalidPayload = {
        senderName: 123, // Should be string
      };

      const dto = plainToClass(SendGenericNewMessageNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints!.isString).toContain('must be a string');
    });
  });

  describe('ValidationPipe whitelist behavior', () => {
    it('should strip unknown properties when whitelist is true', async () => {
      const payloadWithExtra = {
        tokenType: 'apns',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234',
        unknownProperty: 'should be stripped',
        anotherUnknown: 123,
      };

      // Simulate ValidationPipe transformation
      const dto = plainToClass(SendNoteRequest, payloadWithExtra, {
        excludeExtraneousValues: true, // This simulates whitelist: true
      });

      expect(dto).toEqual({
        tokenType: 'apns',
        deviceToken: 'a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234',
      });

      // Should not have unknown properties
      expect((dto as any).unknownProperty).toBeUndefined();
      expect((dto as any).anotherUnknown).toBeUndefined();
    });
  });

  describe('Device token edge cases', () => {
    it('should handle minimum length APNs tokens', async () => {
      const validPayload = {
        tokenType: 'apns',
        deviceToken: 'a1b2c3d4', // Minimum 8 characters
      };

      const dto = plainToClass(SendNoteRequest, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject APNs tokens that are too short', async () => {
      const invalidPayload = {
        tokenType: 'apns',
        deviceToken: 'a1b2c3', // Only 7 characters
      };

      const dto = plainToClass(SendNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints!.isDeviceToken).toContain('must be a valid APNs device token');
    });

    it('should reject APNs tokens that are too long', async () => {
      const invalidPayload = {
        tokenType: 'apns',
        deviceToken: 'a'.repeat(513), // Exceeds 512 character limit
      };

      const dto = plainToClass(SendNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints!.isDeviceToken).toContain('must be a valid APNs device token');
    });

    it('should handle uppercase and lowercase hex in APNs tokens', async () => {
      const validPayload = {
        tokenType: 'apns',
        deviceToken: 'A1B2C3D4e5f61234567890ABCDEF1234567890abcdef1234567890ABCDEF1234',
      };

      const dto = plainToClass(SendNoteRequest, validPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject Firebase tokens with invalid base64url characters', async () => {
      const invalidPayload = {
        tokenType: 'firebase',
        deviceToken: 'eEAR1YiGTkS+invalid/characters=here' + 'a'.repeat(120), // Contains +, /, = which are not base64url
      };

      const dto = plainToClass(SendNoteRequest, invalidPayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toHaveProperty('constraints.isDeviceToken');
      expect(errors[0].constraints!.isDeviceToken).toContain('must be a valid Firebase device token');
    });
  });
});