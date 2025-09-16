import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'app.auth.publicPaths') {
        return ['/system/healthz', '/system/readyz'];
      }
      if (key === 'app.auth.bearer.keyWhitelist') {
        return ['validkey123', 'anothervalidkey456'];
      }
      throw new Error(`Configuration key '${key}' does not exist`);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should load configuration on initialization', () => {
    // Configuration is loaded during guard creation in beforeEach
    // We verify the mock was called correctly during setup
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('app.auth.publicPaths');
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('app.auth.bearer.keyWhitelist');
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        path: '/api/test',
        headers: {},
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;
    });

    it('should allow access to whitelisted paths without API key', () => {
      mockRequest.path = '/system/healthz';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(true);
    });

    it('should allow access to all whitelisted paths', () => {
      const whitelistedPaths = ['/system/healthz', '/system/readyz'];
      
      whitelistedPaths.forEach(path => {
        mockRequest.path = path;
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      });
    });

    it('should allow access with valid API key', () => {
      mockRequest.headers.authorization = 'Bearer validkey123';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(true);
    });

    it('should allow access with any valid API key from whitelist', () => {
      const validKeys = ['validkey123', 'anothervalidkey456'];
      
      validKeys.forEach(key => {
        mockRequest.headers.authorization = `Bearer ${key}`;
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      });
    });

    it('should deny access without API key for non-whitelisted paths', () => {
      mockRequest.path = '/api/protected';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(false);
    });

    it('should deny access with invalid API key', () => {
      mockRequest.headers.authorization = 'Bearer invalidkey';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(false);
    });

    it('should deny access with malformed authorization header', () => {
      mockRequest.headers.authorization = 'invalidformat';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(false);
    });

    it('should deny access when authorization header is empty', () => {
      mockRequest.headers.authorization = '';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(false);
    });

    it('should deny access when authorization header has Bearer but no token', () => {
      mockRequest.headers.authorization = 'Bearer ';
      
      const result = guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(false);
    });
  });

  describe('isWhitelistedPath', () => {
    it('should return true for whitelisted paths', () => {
      expect(guard.isWhitelistedPath('/system/healthz')).toBe(true);
      expect(guard.isWhitelistedPath('/system/readyz')).toBe(true);
    });

    it('should return false for non-whitelisted paths', () => {
      expect(guard.isWhitelistedPath('/api/protected')).toBe(false);
      expect(guard.isWhitelistedPath('/system/other')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(guard.isWhitelistedPath('/SYSTEM/HEALTHZ')).toBe(false);
      expect(guard.isWhitelistedPath('/System/Healthz')).toBe(false);
    });
  });

  describe('hasValidApiKey', () => {
    it('should return true for valid API keys', () => {
      const mockRequest = {
        headers: { authorization: 'Bearer validkey123' }
      };
      
      expect(guard.hasValidApiKey(mockRequest as any)).toBe(true);
    });

    it('should return false for invalid API keys', () => {
      const mockRequest = {
        headers: { authorization: 'Bearer invalidkey' }
      };
      
      expect(guard.hasValidApiKey(mockRequest as any)).toBe(false);
    });

    it('should return false when no authorization header', () => {
      const mockRequest = {
        headers: {}
      };
      
      expect(guard.hasValidApiKey(mockRequest as any)).toBe(false);
    });

    it('should return false for malformed authorization header', () => {
      const mockRequest = {
        headers: { authorization: 'invalidformat' }
      };
      
      expect(guard.hasValidApiKey(mockRequest as any)).toBe(false);
    });

    it('should handle authorization header without Bearer prefix', () => {
      const mockRequest = {
        headers: { authorization: 'validkey123' }
      };
      
      expect(guard.hasValidApiKey(mockRequest as any)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when publicPaths configuration is missing', () => {
      const errorConfigService = {
        getOrThrow: jest.fn().mockImplementation((key: string) => {
          if (key === 'app.auth.publicPaths') {
            throw new Error(`Configuration key '${key}' does not exist`);
          }
          if (key === 'app.auth.bearer.keyWhitelist') {
            return ['validkey123'];
          }
          throw new Error(`Configuration key '${key}' does not exist`);
        })
      };

      expect(() => {
        new ApiKeyGuard(errorConfigService as any);
      }).toThrow(`Configuration key 'app.auth.publicPaths' does not exist`);
    });

    it('should throw error when keyWhitelist configuration is missing', () => {
      const errorConfigService = {
        getOrThrow: jest.fn().mockImplementation((key: string) => {
          if (key === 'app.auth.publicPaths') {
            return ['/system/healthz'];
          }
          if (key === 'app.auth.bearer.keyWhitelist') {
            throw new Error(`Configuration key '${key}' does not exist`);
          }
          throw new Error(`Configuration key '${key}' does not exist`);
        })
      };

      expect(() => {
        new ApiKeyGuard(errorConfigService as any);
      }).toThrow(`Configuration key 'app.auth.bearer.keyWhitelist' does not exist`);
    });
  });
});
