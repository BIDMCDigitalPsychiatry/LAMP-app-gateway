import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';

export class TestUtils {
  /**
   * Create a mock ConfigService with default or custom configuration
   */
  static createMockConfigService(config: any = {}) {
    return {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app') {
          return {
            port: 3000,
            firebase: {
              serviceAccountFileContents: JSON.stringify({
                "type": "service_account",
                "project_id": "test-project",
                "private_key_id": "test-key-id",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKB\nwwggSkAgEAAoIBAQC7VJTUt9Us8cKBwUlHhHHBHEJW2JFxFHDkGDQLxo\n-----END PRIVATE KEY-----\n",
                "client_email": "test@test-project.iam.gserviceaccount.com",
                "client_id": "12345",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
              })
            },
            apns: {
              keyFileContents: 'test-key',
              keyId: 'test-key-id',
              teamId: 'test-team-id',
              bundleId: 'test.bundle.id',
              isProduction: false
            },
            ...config
          };
        }
        return config[key];
      }),
    };
  }

  /**
   * Create a test module with common mocks
   */
  static async createTestModule(options: {
    imports?: any[];
    controllers?: any[];
    providers?: any[];
    overrides?: { provide: any; useValue: any }[];
  } = {}): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      imports: options.imports || [],
      controllers: options.controllers || [],
      providers: [
        {
          provide: ConfigService,
          useValue: TestUtils.createMockConfigService(),
        },
        ...(options.providers || []),
      ],
    });

    // Apply overrides
    if (options.overrides) {
      for (const override of options.overrides) {
        moduleBuilder.overrideProvider(override.provide).useValue(override.useValue);
      }
    }

    return moduleBuilder.compile();
  }

  /**
   * Create a full application for e2e testing
   */
  static async createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(TestUtils.createMockConfigService())
      .compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  /**
   * Common mock implementations
   */
  static mocks = {
    firebaseService: {
      sendPush: jest.fn().mockResolvedValue('message-id-123'),
      sendDemoNotification: jest.fn().mockResolvedValue('message-id-123'),
    },

    apnsService: {
      sendPush: jest.fn().mockResolvedValue(null),
      sendDemoNotification: jest.fn().mockResolvedValue(null),
    },

    configService: TestUtils.createMockConfigService(),
  };

  /**
   * Environment variable helpers
   */
  static withEnvVars(envVars: Record<string, string>, testFn: () => void | Promise<void>) {
    const originalEnv = process.env;
    
    return async () => {
      process.env = { ...originalEnv, ...envVars };
      try {
        await testFn();
      } finally {
        process.env = originalEnv;
      }
    };
  }

  /**
   * Reset all mocks
   */
  static resetMocks() {
    Object.values(TestUtils.mocks).forEach(mock => {
      if (typeof mock === 'object' && mock !== null) {
        Object.values(mock).forEach(fn => {
          if (jest.isMockFunction(fn)) {
            fn.mockReset();
          }
        });
      }
    });
  }
}