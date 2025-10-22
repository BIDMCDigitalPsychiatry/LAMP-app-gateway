import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { TestUtils } from '../src/test/test-utils';
import { FirebaseMessagingService } from '../src/modules/notifications/providers/firebase-messaging.service';
import { ApplePushNotificationService } from '../src/modules/notifications/providers/apple-push-notification.service';
import { AwsEndUserMessagingService, SIMULATOR_PHONE_NUMBERS } from '../src/modules/notifications/providers/aws-end-user-messaging.service';

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
      .overrideProvider(AwsEndUserMessagingService)
      .useValue(TestUtils.mocks.awsSmsService)
      .compile();

    app = moduleFixture.createNestApplication();

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
        .overrideProvider(AwsEndUserMessagingService)
        .useValue(TestUtils.mocks.awsSmsService)
        .compile();

      notifApp = moduleFixture.createNestApplication();
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
      it('/demo/test-apns (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/demo/test-apns')
          .expect(403);
      });

      it('/demo/test-firebase (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/demo/test-firebase')
          .expect(403);
      });

      it('/demo/test-sms (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/demo/test-sms')
          .expect(403);
      });
    });

    describe('With authentication', () => {
      it('/demo/test-apns (POST) should return 403 when device ID not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/demo/test-apns')
          .set(TestUtils.createAuthHeader())
          .expect(403)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 403);
            expect(res.body).toHaveProperty('message', 'Forbidden resource');
          });
      });

      it('/demo/test-firebase (POST) should return 403 when device ID not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/demo/test-firebase')
          .set(TestUtils.createAuthHeader())
          .expect(403)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 403);
            expect(res.body).toHaveProperty('message', 'Forbidden resource');
          });
      });
    });

    describe('Integration tests with working device IDs', () => {
      let integrationApp: INestApplication;
      let mockApnsService: any;
      let mockFirebaseService: any;
      let mockSmsService: any;

      beforeAll(async () => {
        // Reset mocks before starting
        TestUtils.resetMocks();
        mockApnsService = TestUtils.mocks.apnsService;
        mockFirebaseService = TestUtils.mocks.firebaseService;
        mockSmsService = TestUtils.mocks.awsSmsService;
        
        // Set up env vars for working tests
        process.env.DEMO_DEVICE_ID_IOS = 'test-ios-device-token';
        process.env.DEMO_DEVICE_ID_ANDROID = 'test-android-device-token';

        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        })
          .overrideProvider(ConfigService)
          .useValue(TestUtils.createMockConfigService())
          .overrideProvider(FirebaseMessagingService)
          .useValue(mockFirebaseService)
          .overrideProvider(ApplePushNotificationService)
          .useValue(mockApnsService)
          .overrideProvider(AwsEndUserMessagingService)
          .useValue(TestUtils.mocks.awsSmsService)
          .compile();

        integrationApp = moduleFixture.createNestApplication();
        await integrationApp.init();
      });

      afterAll(async () => {
        if (integrationApp) {
          await integrationApp.close();
        }
        // Clean up env vars
        delete process.env.DEMO_DEVICE_ID_IOS;
        delete process.env.DEMO_DEVICE_ID_ANDROID;
      });

      beforeEach(() => {
        // Reset mocks before each test
        mockApnsService.sendMessage.mockClear();
        mockFirebaseService.sendMessage.mockClear();
        mockSmsService.sendMessage.mockClear();
      });

      describe('APNS Integration', () => {
        it('POST /demo/test-apns should make HTTP request and call APNS service with correct device token', async () => {
          const response = await request(integrationApp.getHttpServer())
            .post('/demo/test-apns')
            .set(TestUtils.createAuthHeader())
            .expect(201)
            .expect('ok');

          // Verify the APNS service sendMessage was called with the correct arguments
          expect(mockApnsService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
            { service: 'apns', token: 'test-ios-device-token' },
            expect.objectContaining({
              title: expect.any(String),
              body: expect.any(String)
            })
          );
          
          // Verify Firebase service was NOT called
          expect(mockFirebaseService.sendMessage).not.toHaveBeenCalled();
        });

        it('POST /generic/welcome should call APNS sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'apns', token: 'custom-ios-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send(payload)
            .expect(201)
            .expect('ok');

          // Verify APNS sendMessage was called with correct destination and message structure
          expect(mockApnsService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
            { service: 'apns', token: 'custom-ios-token' },
            expect.objectContaining({
              title: 'Welcome!',
              body: 'Welcome to LAMP'
            })
          );
          
          // Verify Firebase was NOT called
          expect(mockFirebaseService.sendMessage).not.toHaveBeenCalled();
        });

        it('POST /generic/activity-reminder should call APNS sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'apns', token: 'activity-ios-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/generic/activity-reminder')
            .set(TestUtils.createAuthHeader())
            .send(payload)
            .expect(201)
            .expect('ok');

          expect(mockApnsService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
            { service: 'apns', token: 'activity-ios-token' },
            expect.objectContaining({
              title: 'Activity waiting',
              body: 'You have an activity awaiting completion'
            })
          );
        });

        it('POST /generic/new-message should call APNS sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'apns', token: 'message-ios-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/generic/new-message')
            .set(TestUtils.createAuthHeader())
            .send(payload)
            .expect(201)
            .expect('ok');

          expect(mockApnsService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockApnsService.sendMessage).toHaveBeenCalledWith(
            { service: 'apns', token: 'message-ios-token' },
            expect.objectContaining({
              title: 'Message Received',
              body: 'Someone has sent you a message'
            })
          );
        });
      });

      describe('Firebase Integration', () => {
        it('POST /demo/test-firebase should make HTTP request and call Firebase service with correct device token', async () => {
          await request(integrationApp.getHttpServer())
            .post('/demo/test-firebase')
            .set(TestUtils.createAuthHeader())
            .expect(201)
            .expect('ok');

          // Verify Firebase service sendMessage was called with the correct arguments
          expect(mockFirebaseService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockFirebaseService.sendMessage).toHaveBeenCalledWith(
            { service: 'firebase', token: 'test-android-device-token' },
            expect.objectContaining({
              title: expect.any(String),
              body: expect.any(String)
            })
          );

          // Verify APNS service was NOT called
          expect(mockApnsService.sendMessage).not.toHaveBeenCalled();
        });

        it('POST /generic/welcome should call Firebase sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'firebase', token: 'custom-android-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send(payload)
            .expect(201)
            .expect('ok');

          expect(mockFirebaseService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockFirebaseService.sendMessage).toHaveBeenCalledWith(
            { service: 'firebase', token: 'custom-android-token' },
            expect.objectContaining({
              title: 'Welcome!',
              body: 'Welcome to LAMP'
            })
          );

          // Verify APNS was NOT called
          expect(mockApnsService.sendMessage).not.toHaveBeenCalled();
        });
      });

      describe('SMS Integration', () => {
        it('POST /demo/test-sms should make HTTP request and call AWS SMS service with simulator phone number', async () => {
          await request(integrationApp.getHttpServer())
            .post('/demo/test-sms')
            .set(TestUtils.createAuthHeader())
            .expect(201)
            .expect('ok');

          // Verify AWS SMS service sendMessage was called with the correct arguments
          expect(mockSmsService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
            SIMULATOR_PHONE_NUMBERS.US.SUCCESS,
            expect.objectContaining({
              title: expect.any(String),
              body: expect.any(String)
            })
          );

          // Verify APNS and Firebase services were NOT called
          expect(mockApnsService.sendMessage).not.toHaveBeenCalled();
          expect(mockFirebaseService.sendMessage).not.toHaveBeenCalled();
        });
      });

      describe('Validation tests', () => {
        it('POST /generic/welcome should reject empty body', async () => {
          await request(integrationApp.getHttpServer())
            .post('/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send({})
            .expect(400)
            .expect((res: any) => {
              expect(res.body).toHaveProperty('statusCode', 400);
              expect(res.body).toHaveProperty('message');
              expect(res.body.message).toContain('Validation failed');
            });
        });

        it('POST /generic/welcome should reject missing destination field', async () => {
          await request(integrationApp.getHttpServer())
            .post('/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send({ options: {} })
            .expect(400)
            .expect((res: any) => {
              expect(res.body).toHaveProperty('statusCode', 400);
              expect(res.body).toHaveProperty('message');
              expect(res.body.message).toContain('Validation failed');
            });
        });

        it('POST /generic/welcome should reject invalid destination service', async () => {
          await request(integrationApp.getHttpServer())
            .post('/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send({ 
              destination: { service: 'invalid', token: 'test-token' },
              options: {}
            })
            .expect(400)
            .expect((res: any) => {
              expect(res.body).toHaveProperty('statusCode', 400);
              expect(res.body).toHaveProperty('message');
            });
        });

        it('POST /generic/welcome should reject missing token in destination', async () => {
          await request(integrationApp.getHttpServer())
            .post('/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send({ 
              destination: { service: 'apns' },
              options: {}
            })
            .expect(400)
            .expect((res: any) => {
              expect(res.body).toHaveProperty('statusCode', 400);
              expect(res.body).toHaveProperty('message');
              expect(res.body.message).toContain('Validation failed');
            });
        });

        it('POST /generic/activity-reminder should reject empty body', async () => {
          await request(integrationApp.getHttpServer())
            .post('/generic/activity-reminder')
            .set(TestUtils.createAuthHeader())
            .send({})
            .expect(400);
        });

        it('POST /generic/new-message should reject empty body', async () => {
          await request(integrationApp.getHttpServer())
            .post('/generic/new-message')
            .set(TestUtils.createAuthHeader())
            .send({})
            .expect(400);
        });
      });
    });

  });

  describe('Validation error handling', () => {
    it('should return detailed validation errors for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/generic/welcome')
        .set(TestUtils.createAuthHeader())
        .send({})
        .expect(400)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message', 'Validation failed');
          expect(res.body).toHaveProperty('errors');
          expect(Array.isArray(res.body.errors)).toBe(true);
          expect(res.body.errors.length).toBeGreaterThan(0);
          // Should have error for missing 'destination' field
          expect(res.body.errors.some((error: any) =>
            error.path && error.path.includes('destination')
          )).toBe(true);
        });
    });

    it('should return detailed validation errors for invalid field types', () => {
      return request(app.getHttpServer())
        .post('/generic/welcome')
        .set(TestUtils.createAuthHeader())
        .send({
          destination: {
            service: 'invalid-service',
            token: 123 // Should be string
          }
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message', 'Validation failed');
          expect(res.body).toHaveProperty('errors');
          expect(Array.isArray(res.body.errors)).toBe(true);
          expect(res.body.errors.length).toBeGreaterThan(0);

          // Should have specific field-level errors
          const errors = res.body.errors;
          expect(errors.some((error: any) =>
            error.path && error.message && error.code
          )).toBe(true);
        });
    });

    it('should return detailed validation errors for discriminated union mismatch', () => {
      return request(app.getHttpServer())
        .post('/generic/welcome')
        .set(TestUtils.createAuthHeader())
        .send({
          destination: {
            service: 'apns'
            // Missing required 'token' field for apns service
          }
        })
        .expect(400)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message', 'Validation failed');
          expect(res.body).toHaveProperty('errors');
          expect(Array.isArray(res.body.errors)).toBe(true);
          expect(res.body.errors.length).toBeGreaterThan(0);

          // Should include path information for the missing token
          const errors = res.body.errors;
          expect(errors.some((error: any) =>
            error.path && (error.path.includes('token') || error.path.includes('destination'))
          )).toBe(true);
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