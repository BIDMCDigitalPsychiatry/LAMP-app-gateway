import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { TestUtils } from '../src/test/test-utils';
import { FirebaseMessagingService } from '../src/modules/notifications/firebase-messaging.service';
import { ApplePushNotificationService } from '../src/modules/notifications/apple-push-notification.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let testApiKey: string;

  beforeEach(async () => {
    testApiKey = TestUtils.getTestApiKey();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(TestUtils.createMockConfigService())
      .overrideProvider(FirebaseMessagingService)
      .useValue(TestUtils.mocks.firebaseService)
      .overrideProvider(ApplePushNotificationService)
      .useValue(TestUtils.mocks.apnsService)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same exception filter as in main.ts
    const { SentryExceptionFilter } = require('../src/filters/sentry-exception.filter');
    app.useGlobalFilters(new SentryExceptionFilter());
    
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('System endpoints', () => {
    describe('Public endpoints (no authentication required)', () => {
      it('/system/healthz (GET) should work without authentication', () => {
        return request(app.getHttpServer())
          .get('/system/healthz')
          .expect(200)
          .expect({ ok: true });
      });

      it('/system/readyz (GET) should work without authentication', () => {
        return request(app.getHttpServer())
          .get('/system/readyz')
          .expect(200)
          .expect({ ok: true });
      });
    });

    describe('Protected endpoints (require authentication)', () => {
      it('/ (GET) should require authentication', () => {
        return request(app.getHttpServer())
          .get('/')
          .expect(403);
      });

      it('/ (GET) should work with valid API key', () => {
        return request(app.getHttpServer())
          .get('/')
          .set(TestUtils.createAuthHeader())
          .expect(200)
          .expect({ ok: true });
      });

      it('/ (GET) should reject invalid API key', () => {
        return request(app.getHttpServer())
          .get('/')
          .set(TestUtils.createAuthHeader('invalid-key'))
          .expect(403);
      });

      it('/system/metrics (GET) should require authentication', () => {
        return request(app.getHttpServer())
          .get('/system/metrics')
          .expect(403);
      });

      it('/system/metrics (GET) should work with valid API key', () => {
        return request(app.getHttpServer())
          .get('/system/metrics')
          .set(TestUtils.createAuthHeader())
          .expect(200)
          .expect('');
      });

      it('/system/version (GET) should require authentication', () => {
        return request(app.getHttpServer())
          .get('/system/version')
          .expect(403);
      });

      it('/system/version (GET) should work with valid API key', () => {
        return request(app.getHttpServer())
          .get('/system/version')
          .set(TestUtils.createAuthHeader())
          .expect(200)
          .expect((res: any) => {
            // Verify the response has the expected structure
            // Note: version and revision will be undefined, which gets omitted from JSON
            expect(res.body).toEqual(
              expect.objectContaining({
                created: expect.objectContaining({})
              })
            );
            // The response may not include undefined properties in JSON
            expect(res.body).toHaveProperty('created');
          });
      });

      it('/debug-sentry (GET) should require authentication', () => {
        return request(app.getHttpServer())
          .get('/debug-sentry')
          .expect(403);
      });

      it('/debug-sentry (GET) should work with valid API key and return 500', () => {
        return request(app.getHttpServer())
          .get('/debug-sentry')
          .set(TestUtils.createAuthHeader())
          .expect(500)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 500);
            expect(res.body).toHaveProperty('message', 'Internal server error');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path', '/debug-sentry');
          });
      });
    });
  });

  describe('Notification endpoints', () => {
    let notifApp: INestApplication;
    
    beforeAll(async () => {
      // Ensure env vars are not set for these tests
      const originalIOS = process.env.DEMO_DEVICE_ID_IOS;
      const originalAndroid = process.env.DEMO_DEVICE_ID_ANDROID;
      delete process.env.DEMO_DEVICE_ID_IOS;
      delete process.env.DEMO_DEVICE_ID_ANDROID;

      // Create a fresh app without the env vars
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(ConfigService)
        .useValue(TestUtils.createMockConfigService())
        .overrideProvider(FirebaseMessagingService)
        .useValue(TestUtils.mocks.firebaseService)
        .overrideProvider(ApplePushNotificationService)
        .useValue(TestUtils.mocks.apnsService)
        .compile();

      notifApp = moduleFixture.createNestApplication();
      const { SentryExceptionFilter } = require('../src/filters/sentry-exception.filter');
      notifApp.useGlobalFilters(new SentryExceptionFilter());
      await notifApp.init();

      // Restore env vars after app creation
      if (originalIOS) process.env.DEMO_DEVICE_ID_IOS = originalIOS;
      if (originalAndroid) process.env.DEMO_DEVICE_ID_ANDROID = originalAndroid;
    });

    afterAll(async () => {
      if (notifApp) {
        await notifApp.close();
      }
    });

    describe('Authentication tests', () => {
      it('/test-apns (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/test-apns')
          .expect(403);
      });

      it('/test-firebase (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/test-firebase')
          .expect(403);
      });
    });

    describe('With authentication', () => {
      it('/test-apns (POST) should return 403 when device ID not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/test-apns')
          .set(TestUtils.createAuthHeader())
          .expect(403)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 403);
            expect(res.body).toHaveProperty('message', 'DEMO_DEVICE_ID_IOS not configured');
          });
      });

      it('/test-firebase (POST) should return 403 when device ID not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/test-firebase')
          .set(TestUtils.createAuthHeader())
          .expect(403)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 403);
            expect(res.body).toHaveProperty('message', 'DEMO_DEVICE_ID_ANDROID not configured');
          });
      });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes (authentication not checked for non-existent routes)', () => {
      return request(app.getHttpServer())
        .get('/unknown-route')
        .expect(404);
    });

    it('should return 404 for unknown routes with authentication', () => {
      return request(app.getHttpServer())
        .get('/unknown-route')
        .set(TestUtils.createAuthHeader())
        .expect(404);
    });
  });
});