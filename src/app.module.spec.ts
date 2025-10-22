import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { FirebaseMessagingService } from './modules/notifications/providers/firebase-messaging.service';
import { ApplePushNotificationService } from './modules/notifications/providers/apple-push-notification.service';
import { SystemController } from './modules/system/system.controller';
import { TestUtils } from './test/test-utils';
import { DemoNotificationsController } from './modules/notifications/controllers/demo-notifications.controller';
import { GenericPushNotificationsController } from './modules/notifications/controllers/generic-push-notifications.controller';
import { OneTimePasswordsController } from './modules/notifications/controllers/one-time-passwords.controller';

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

    it('should have DemoNotificationsController available', () => {
      const demoNotificationsController = module.get(DemoNotificationsController);
      expect(demoNotificationsController).toBeDefined();
    });

    it('should have GenericPushNotificationsController available', () => {
      const genericPushNotificationsController = module.get(GenericPushNotificationsController);
      expect(genericPushNotificationsController).toBeDefined();
    });

    it('should have OneTimePasswordsController available', () => {
      const oneTimePasswordsController = module.get(OneTimePasswordsController);
      expect(oneTimePasswordsController).toBeDefined();
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
      // Test that controllers exist and can be called
      const systemController = module.get(SystemController);
      expect(() => systemController.healthz()).not.toThrow();
      expect(systemController.healthz()).toEqual({ ok: true });
      
      // GenericPushNotificationsController should have access to mocked services
      const genericPushNotificationsController = module.get(GenericPushNotificationsController);
      expect(genericPushNotificationsController).toBeDefined();
    });

    it('should have properly initialized all modules', () => {
      // Verify the module compiled successfully with all dependencies
      expect(module).toBeDefined();
      
      // Check that we can retrieve key components without errors
      expect(() => module.get(ConfigService)).not.toThrow();
      expect(() => module.get(SystemController)).not.toThrow();
      expect(() => module.get(DemoNotificationsController)).not.toThrow();
      expect(() => module.get(GenericPushNotificationsController)).not.toThrow();
      expect(() => module.get(OneTimePasswordsController)).not.toThrow();
    });
  });
});