
import { ExecutionContext } from '@nestjs/common';
import { EnvRequirementGuard } from './env-requirement.guard';

describe('EnvRequirementGuard', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    
    // Create mock execution context
    mockContext = {
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Single environment variable', () => {
    it('should be defined', () => {
      const guard = new EnvRequirementGuard('TEST_VAR');
      expect(guard).toBeDefined();
    });

    it('should return true when required environment variable is set', () => {
      process.env.TEST_VAR = 'some-value';
      
      const guard = new EnvRequirementGuard('TEST_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should return false when required environment variable is not set', () => {
      delete process.env.TEST_VAR;
      
      const guard = new EnvRequirementGuard('TEST_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should return false when environment variable is set to empty string', () => {
      process.env.TEST_VAR = '';
      
      const guard = new EnvRequirementGuard('TEST_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should return false when environment variable is set to only whitespace', () => {
      process.env.TEST_VAR = '   ';
      
      const guard = new EnvRequirementGuard('TEST_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should return true when environment variable has whitespace but contains content', () => {
      process.env.TEST_VAR = '  some-value  ';
      
      const guard = new EnvRequirementGuard('TEST_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });
  });

  describe('Multiple environment variables (array)', () => {
    it('should return true when all required environment variables are set', () => {
      process.env.VAR1 = 'value1';
      process.env.VAR2 = 'value2';
      process.env.VAR3 = 'value3';
      
      const guard = new EnvRequirementGuard(['VAR1', 'VAR2', 'VAR3']);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should return false when some required environment variables are missing', () => {
      process.env.VAR1 = 'value1';
      process.env.VAR2 = 'value2';
      delete process.env.VAR3;
      
      const guard = new EnvRequirementGuard(['VAR1', 'VAR2', 'VAR3']);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should return false when all required environment variables are missing', () => {
      delete process.env.VAR1;
      delete process.env.VAR2;
      delete process.env.VAR3;
      
      const guard = new EnvRequirementGuard(['VAR1', 'VAR2', 'VAR3']);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should return false when some environment variables are empty strings', () => {
      process.env.VAR1 = 'value1';
      process.env.VAR2 = '';
      process.env.VAR3 = 'value3';
      
      const guard = new EnvRequirementGuard(['VAR1', 'VAR2', 'VAR3']);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should handle empty array of environment variables', () => {
      const guard = new EnvRequirementGuard([]);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true); // No requirements to check
    });
  });

  describe('Real-world scenarios', () => {
    it('should work with demo device ID variables', () => {
      process.env.DEMO_DEVICE_ID_IOS = 'ios-device-token';
      process.env.DEMO_DEVICE_ID_ANDROID = 'android-device-token';
      
      const guard = new EnvRequirementGuard(['DEMO_DEVICE_ID_IOS', 'DEMO_DEVICE_ID_ANDROID']);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should work with API key variables', () => {
      process.env.API_KEYS = 'key1,key2,key3';
      
      const guard = new EnvRequirementGuard('API_KEYS');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should work with database configuration variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:port/db';
      process.env.DATABASE_SSL = 'true';
      
      const guard = new EnvRequirementGuard(['DATABASE_URL', 'DATABASE_SSL']);
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle null environment variable value', () => {
      // Simulate null value (though process.env typically has string values)
      Object.defineProperty(process.env, 'NULL_VAR', {
        value: null,
        enumerable: true,
        configurable: true
      });
      
      const guard = new EnvRequirementGuard('NULL_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should handle undefined environment variable value', () => {
      const guard = new EnvRequirementGuard('UNDEFINED_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should handle environment variable with numeric value', () => {
      process.env.NUMERIC_VAR = '12345';
      
      const guard = new EnvRequirementGuard('NUMERIC_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should handle environment variable with boolean-like value', () => {
      process.env.BOOLEAN_VAR = 'false';
      
      const guard = new EnvRequirementGuard('BOOLEAN_VAR');
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });
  });
});
