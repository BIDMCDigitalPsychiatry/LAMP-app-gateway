import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { FirebaseMessagingService } from './modules/notifications/firebase-messaging.service';
import { ApplePushNotificationService } from './modules/notifications/apple-push-notification.service';
import { SystemController } from './modules/system/system.controller';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { TestUtils } from './test/test-utils';

describe('AppModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    // Set required environment variables
    process.env.API_KEYS = 'testkey123456,anothertestkey123';
    process.env.APNS_KEY_FILE_BASE64 = Buffer.from('test-key').toString('base64');
    process.env.APNS_KEY_ID = 'test-key-id';
    process.env.APNS_TEAM_ID = 'test-team-id';
    process.env.APNS_BUNDLE_ID = 'test.bundle.id';
    process.env.APNS_USE_PRODUCTION_ENDPOINT = 'false';
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = Buffer.from(JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: '12345',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    })).toString('base64');
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirebaseMessagingService)
      .useValue(TestUtils.mocks.firebaseService)
      .overrideProvider(ApplePushNotificationService)  
      .useValue(TestUtils.mocks.apnsService)
      .compile();

  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should compile without errors', async () => {
    expect(module).toBeInstanceOf(TestingModule);
  });

  describe('Module structure', () => {
    it('should have ConfigService available', () => {
      const configService = module.get(ConfigService);
      expect(configService).toBeDefined();
      expect(configService.get).toBeDefined();
    });

    it('should have SystemController available', () => {
      const systemController = module.get(SystemController);
      expect(systemController).toBeDefined();
    });

    it('should have NotificationsController available', () => {
      const notificationsController = module.get(NotificationsController);
      expect(notificationsController).toBeDefined();
    });

    it('should have mocked FirebaseMessagingService available', () => {
      const firebaseService = module.get(FirebaseMessagingService);
      expect(firebaseService).toBeDefined();
      expect(firebaseService).toBe(TestUtils.mocks.firebaseService);
    });

    it('should have mocked ApplePushNotificationService available', () => {
      const apnsService = module.get(ApplePushNotificationService);
      expect(apnsService).toBeDefined();
      expect(apnsService).toBe(TestUtils.mocks.apnsService);
    });
  });

  describe('Module integration', () => {
    it('should allow controllers to access their dependencies', () => {
      const systemController = module.get(SystemController);
      const notificationsController = module.get(NotificationsController);
      
      // Test that controllers exist and can be called
      expect(() => systemController.healthz()).not.toThrow();
      expect(systemController.healthz()).toEqual({ ok: true });
      
      // NotificationsController should have access to mocked services
      expect(notificationsController).toBeDefined();
    });

    it('should have properly initialized all modules', () => {
      // Verify the module compiled successfully with all dependencies
      expect(module).toBeDefined();
      
      // Check that we can retrieve key components without errors
      expect(() => module.get(ConfigService)).not.toThrow();
      expect(() => module.get(SystemController)).not.toThrow();
      expect(() => module.get(NotificationsController)).not.toThrow();
    });
  });
});