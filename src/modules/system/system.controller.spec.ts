import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';

describe('SystemController', () => {
  let controller: SystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
    }).compile();

    controller = module.get<SystemController>(SystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthz', () => {
    it('should return ok true', () => {
      const result = controller.healthz();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('systemHealthz', () => {
    it('should return ok true', () => {
      const result = controller.systemHealthz();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('readyz', () => {
    it('should return ok true', () => {
      const result = controller.readyz();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('metrics', () => {
    it('should return empty string', () => {
      const result = controller.metrics();
      expect(result).toBe('');
    });
  });

  describe('version', () => {
    it('should return version info when env vars are set', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        ORG_OPENCONTAINERS_IMAGE_VERSION: '1.0.0',
        ORG_OPENCONTAINERS_IMAGE_REVISION: 'abc123',
        ORG_OPENCONTAINERS_IMAGE_CREATED: '2023-01-01T00:00:00Z',
      };

      const result = controller.version();

      expect(result).toEqual({
        version: '1.0.0',
        revision: 'abc123',
        created: {
          utc: '2023-01-01T00:00:00Z',
        },
      });

      process.env = originalEnv;
    });

    it('should return undefined values when env vars are not set', () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.ORG_OPENCONTAINERS_IMAGE_VERSION;
      delete process.env.ORG_OPENCONTAINERS_IMAGE_REVISION;
      delete process.env.ORG_OPENCONTAINERS_IMAGE_CREATED;

      const result = controller.version();

      expect(result).toEqual({
        version: undefined,
        revision: undefined,
        created: {
          utc: undefined,
        },
      });

      process.env = originalEnv;
    });
  });

  describe('debugSentry', () => {
    it('should throw an error', () => {
      expect(() => controller.debugSentry()).toThrow('My first Sentry error!');
    });
  });
});