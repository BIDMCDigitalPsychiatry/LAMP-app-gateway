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

  beforeEach(async () => {
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
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect({ ok: true });
    });

    it('/system/healthz (GET)', () => {
      return request(app.getHttpServer())
        .get('/system/healthz')
        .expect(200)
        .expect({ ok: true });
    });

    it('/system/readyz (GET)', () => {
      return request(app.getHttpServer())
        .get('/system/readyz')
        .expect(200)
        .expect({ ok: true });
    });

    it('/system/metrics (GET)', () => {
      return request(app.getHttpServer())
        .get('/system/metrics')
        .expect(200)
        .expect('');
    });

    it('/system/version (GET)', () => {
      return request(app.getHttpServer())
        .get('/system/version')
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

    it('/debug-sentry (GET) should return 500', () => {
      return request(app.getHttpServer())
        .get('/debug-sentry')
        .expect(500)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('statusCode', 500);
          expect(res.body).toHaveProperty('message', 'Internal server error');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path', '/debug-sentry');
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

    it('/test-apns (POST) should return 403 when device ID not configured', () => {
      return request(notifApp.getHttpServer())
        .post('/test-apns')
        .expect(403)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('statusCode', 403);
          expect(res.body).toHaveProperty('message', 'DEMO_DEVICE_ID_IOS not configured');
        });
    });

    it('/test-firebase (POST) should return 403 when device ID not configured', () => {
      return request(notifApp.getHttpServer())
        .post('/test-firebase')
        .expect(403)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('statusCode', 403);
          expect(res.body).toHaveProperty('message', 'DEMO_DEVICE_ID_ANDROID not configured');
        });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/unknown-route')
        .expect(404);
    });
  });
});