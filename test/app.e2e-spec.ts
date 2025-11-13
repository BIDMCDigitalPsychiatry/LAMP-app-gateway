import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { TestUtils } from '../src/test/test-utils';
import { FirebaseMessagingService } from '../src/modules/notifications/providers/firebase-messaging.service';
import { ApplePushNotificationService } from '../src/modules/notifications/providers/apple-push-notification.service';
import { AwsEndUserMessagingService, SIMULATOR_PHONE_NUMBERS } from '../src/modules/notifications/providers/aws-end-user-messaging.service';
import { AwsEmailService } from '../src/modules/notifications/providers/aws-email.service';

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
      .overrideProvider(AwsEmailService)
      .useValue(TestUtils.mocks.awsEmailService)
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
      const originalEmail = process.env.DEMO_EMAIL_ADDR;
      delete process.env.DEMO_DEVICE_ID_IOS;
      delete process.env.DEMO_DEVICE_ID_ANDROID;
      delete process.env.DEMO_EMAIL_ADDR;

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
        .overrideProvider(AwsEmailService)
        .useValue(TestUtils.mocks.awsEmailService)
        .compile();

      notifApp = moduleFixture.createNestApplication();
      await notifApp.init();

      // Restore env vars after app creation
      if (originalIOS) process.env.DEMO_DEVICE_ID_IOS = originalIOS;
      if (originalAndroid) process.env.DEMO_DEVICE_ID_ANDROID = originalAndroid;
      if (originalEmail) process.env.DEMO_EMAIL_ADDR = originalEmail;
    });

    afterAll(async () => {
      if (notifApp) {
        await notifApp.close();
      }
    });

    describe('Authentication tests', () => {
      it('/v1/demo/test-apns (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-apns')
          .expect(403);
      });

      it('/v1/demo/test-firebase (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-firebase')
          .expect(403);
      });

      it('/v1/demo/test-sms (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-sms')
          .expect(403);
      });

      it('/v1/demo/test-email (POST) should require authentication', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-email')
          .expect(403);
      });
    });

    describe('With authentication', () => {
      it('/v1/demo/test-apns (POST) should return 403 when device ID not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-apns')
          .set(TestUtils.createAuthHeader())
          .expect(403)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 403);
            expect(res.body).toHaveProperty('message', 'Forbidden resource');
          });
      });

      it('/v1/demo/test-firebase (POST) should return 403 when device ID not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-firebase')
          .set(TestUtils.createAuthHeader())
          .expect(403)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 403);
            expect(res.body).toHaveProperty('message', 'Forbidden resource');
          });
      });

      it('/v1/demo/test-email (POST) should return 403 when email address not configured', () => {
        return request(notifApp.getHttpServer())
          .post('/v1/demo/test-email')
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
      let mockEmailService: any;

      beforeAll(async () => {
        // Reset mocks before starting
        TestUtils.resetMocks();
        mockApnsService = TestUtils.mocks.apnsService;
        mockFirebaseService = TestUtils.mocks.firebaseService;
        mockSmsService = TestUtils.mocks.awsSmsService;
        mockEmailService = TestUtils.mocks.awsEmailService;
        
        // Set up env vars for working tests
        process.env.DEMO_DEVICE_ID_IOS = 'test-ios-device-token';
        process.env.DEMO_DEVICE_ID_ANDROID = 'test-android-device-token';
        process.env.DEMO_EMAIL_ADDR = 'test@example.com';

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
          .overrideProvider(AwsEmailService)
          .useValue(mockEmailService)
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
        delete process.env.DEMO_EMAIL_ADDR;
      });

      beforeEach(() => {
        // Reset mocks before each test
        mockApnsService.sendMessage.mockClear();
        mockFirebaseService.sendMessage.mockClear();
        mockSmsService.sendMessage.mockClear();
        mockEmailService.sendMessage.mockClear();
      });

      describe('APNS Integration', () => {
        it('POST /v1/demo/test-apns should make HTTP request and call APNS service with correct device token', async () => {
          const response = await request(integrationApp.getHttpServer())
            .post('/v1/demo/test-apns')
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

        it('POST /v1/generic/welcome should call APNS sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'apns', token: 'custom-ios-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/v1/generic/welcome')
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

        it('POST /v1/generic/activity-reminder should call APNS sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'apns', token: 'activity-ios-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/v1/generic/activity-reminder')
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

        it('POST /v1/generic/new-message should call APNS sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'apns', token: 'message-ios-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/v1/generic/new-message')
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
        it('POST /v1/demo/test-firebase should make HTTP request and call Firebase service with correct device token', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/demo/test-firebase')
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

        it('POST /v1/generic/welcome should call Firebase sendMessage with correct arguments', async () => {
          const payload = {
            destination: { service: 'firebase', token: 'custom-android-token' },
            options: {}
          };

          await request(integrationApp.getHttpServer())
            .post('/v1/generic/welcome')
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
        it('POST /v1/demo/test-sms should make HTTP request and call AWS SMS service with simulator phone number', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/demo/test-sms')
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

      describe('Email Integration', () => {
        it('POST /v1/demo/test-email should make HTTP request and call AWS Email service with demo email address', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/demo/test-email')
            .set(TestUtils.createAuthHeader())
            .expect(201)
            .expect('ok');

          // Verify AWS Email service sendMessage was called with the correct arguments
          expect(mockEmailService.sendMessage).toHaveBeenCalledTimes(1);
          expect(mockEmailService.sendMessage).toHaveBeenCalledWith(
            'test@example.com',
            expect.objectContaining({
              title: expect.any(String),
              body: expect.any(String)
            })
          );

          // Verify APNS, Firebase, and SMS services were NOT called
          expect(mockApnsService.sendMessage).not.toHaveBeenCalled();
          expect(mockFirebaseService.sendMessage).not.toHaveBeenCalled();
          expect(mockSmsService.sendMessage).not.toHaveBeenCalled();
        });
      });

      describe('Validation tests', () => {
        it('POST /v1/generic/welcome should reject empty body', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send({})
            .expect(400)
            .expect((res: any) => {
              expect(res.body).toHaveProperty('statusCode', 400);
              expect(res.body).toHaveProperty('message');
              expect(res.body.message).toContain('Validation failed');
            });
        });

        it('POST /v1/generic/welcome should reject missing destination field', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/generic/welcome')
            .set(TestUtils.createAuthHeader())
            .send({ options: {} })
            .expect(400)
            .expect((res: any) => {
              expect(res.body).toHaveProperty('statusCode', 400);
              expect(res.body).toHaveProperty('message');
              expect(res.body.message).toContain('Validation failed');
            });
        });

        it('POST /v1/generic/welcome should reject invalid destination service', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/generic/welcome')
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

        it('POST /v1/generic/welcome should reject missing token in destination', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/generic/welcome')
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

        it('POST /v1/generic/activity-reminder should reject empty body', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/generic/activity-reminder')
            .set(TestUtils.createAuthHeader())
            .send({})
            .expect(400);
        });

        it('POST /v1/generic/new-message should reject empty body', async () => {
          await request(integrationApp.getHttpServer())
            .post('/v1/generic/new-message')
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
        .post('/v1/generic/welcome')
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
        .post('/v1/generic/welcome')
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
        .post('/v1/generic/welcome')
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

  describe('One-Time Password (OTP) endpoints', () => {
    let otpApp: INestApplication;
    let mockOtpService: any;
    let mockOtpStorageService: any;
    let mockOtpManagerService: any;
    let mockSmsService: any;
    let mockEmailService: any;

    beforeAll(async () => {
      // Create mock services for OTP functionality
      mockOtpService = {
        generateOneTimePassword: jest.fn().mockResolvedValue({
          code: '123456',
          hash: '$argon2id$v=19$m=65536,t=3,p=4$test-salt$test-hash',
          exp: Date.now() + 15 * 60 * 1000,
        }),
        verifyOneTimePassword: jest.fn().mockResolvedValue(true),
      };

      mockOtpStorageService = {
        fetch: jest.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$test-salt$test-hash'),
        save: jest.fn().mockResolvedValue(undefined),
        removeAllFor: jest.fn().mockResolvedValue(undefined),
      };

      mockOtpManagerService = {
        sendOneTimePasswordViaEmail: jest.fn().mockResolvedValue(undefined),
        sendOneTimePasswordViaSms: jest.fn().mockResolvedValue(undefined),
        validateOneTimePassword: jest.fn().mockResolvedValue(true),
      };

      mockSmsService = {
        sendMessage: jest.fn().mockResolvedValue({
          messageId: 'test-message-id',
          vendorMessageId: 'aws-sms-id-123',
          successful: true,
        }),
      };

      mockEmailService = {
        sendMessage: jest.fn().mockResolvedValue({
          messageId: 'test-message-id',
          vendorMessageId: 'ses-message-id-123',
          successful: true,
        }),
      };

      const { OtpService } = await import('../src/modules/notifications/services/one-time-password/otp.service');
      const { OtpStorageService } = await import('../src/modules/notifications/services/one-time-password/otp-storage.service');
      const { OtpManagerService } = await import('../src/modules/notifications/services/one-time-password/otp-manager.service');

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
        .useValue(mockSmsService)
        .overrideProvider(AwsEmailService)
        .useValue(mockEmailService)
        .overrideProvider(OtpService)
        .useValue(mockOtpService)
        .overrideProvider(OtpStorageService)
        .useValue(mockOtpStorageService)
        .overrideProvider(OtpManagerService)
        .useValue(mockOtpManagerService)
        .compile();

      otpApp = moduleFixture.createNestApplication();
      await otpApp.init();
    });

    afterAll(async () => {
      if (otpApp) {
        await otpApp.close();
      }
    });

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    describe('Authentication tests', () => {
      it('POST /v1/otp/email should require authentication', () => {
        return request(otpApp.getHttpServer())
          .post('/v1/otp/email')
          .send({ email: 'test@example.com' })
          .expect(403);
      });

      it('POST /v1/otp/text-message should require authentication', () => {
        return request(otpApp.getHttpServer())
          .post('/v1/otp/text-message')
          .send({ phoneNumber: '+12345678901' })
          .expect(403);
      });

      it('POST /v1/otp/verify should require authentication', () => {
        return request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .send({ identifier: 'test@example.com', code: '123456' })
          .expect(403);
      });
    });

    describe('Send OTP via Email', () => {
      it('should send OTP via email with valid email address', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/email')
          .set(TestUtils.createAuthHeader())
          .send({ email: 'test@example.com' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.sendOneTimePasswordViaEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockOtpManagerService.sendOneTimePasswordViaEmail).toHaveBeenCalledTimes(1);
      });

      it('should reject invalid email format', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/email')
          .set(TestUtils.createAuthHeader())
          .send({ email: 'not-an-email' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.sendOneTimePasswordViaEmail).not.toHaveBeenCalled();
      });

      it('should reject missing email field', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/email')
          .set(TestUtils.createAuthHeader())
          .send({})
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.sendOneTimePasswordViaEmail).not.toHaveBeenCalled();
      });
    });

    describe('Send OTP via SMS', () => {
      it('should send OTP via SMS with valid E.164 phone number', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/text-message')
          .set(TestUtils.createAuthHeader())
          .send({ phoneNumber: '+12345678901' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.sendOneTimePasswordViaSms).toHaveBeenCalledWith('+12345678901');
        expect(mockOtpManagerService.sendOneTimePasswordViaSms).toHaveBeenCalledTimes(1);
      });

      it('should reject invalid phone number format', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/text-message')
          .set(TestUtils.createAuthHeader())
          .send({ phoneNumber: '1234567890' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.sendOneTimePasswordViaSms).not.toHaveBeenCalled();
      });

      it('should reject missing phoneNumber field', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/text-message')
          .set(TestUtils.createAuthHeader())
          .send({})
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.sendOneTimePasswordViaSms).not.toHaveBeenCalled();
      });
    });

    describe('Verify OTP', () => {
      it('should return ok when OTP is valid with email identifier', async () => {
        mockOtpManagerService.validateOneTimePassword.mockResolvedValue(true);

        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'test@example.com', code: '123456' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('test@example.com', '123456');
        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledTimes(1);
      });

      it('should return ok when OTP is valid with phone number identifier', async () => {
        mockOtpManagerService.validateOneTimePassword.mockResolvedValue(true);

        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: '+12345678901', code: '654321' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('+12345678901', '654321');
        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledTimes(1);
      });

      it('should return fail when OTP is invalid', async () => {
        mockOtpManagerService.validateOneTimePassword.mockResolvedValue(false);

        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'test@example.com', code: '999999' })
          .expect(201)
          .expect('fail');

        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('test@example.com', '999999');
        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledTimes(1);
      });

      it('should reject code that is not 6 digits', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'test@example.com', code: '123' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.validateOneTimePassword).not.toHaveBeenCalled();
      });

      it('should reject code with non-numeric characters', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'test@example.com', code: 'abcdef' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.validateOneTimePassword).not.toHaveBeenCalled();
      });

      it('should reject invalid identifier format', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'not-email-or-phone', code: '123456' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.validateOneTimePassword).not.toHaveBeenCalled();
      });

      it('should reject missing identifier field', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ code: '123456' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.validateOneTimePassword).not.toHaveBeenCalled();
      });

      it('should reject missing code field', async () => {
        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'test@example.com' })
          .expect(400)
          .expect((res: any) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Validation failed');
          });

        expect(mockOtpManagerService.validateOneTimePassword).not.toHaveBeenCalled();
      });
    });

    describe('Complete OTP flow integration', () => {
      it('should complete full email OTP flow: send, then verify', async () => {
        // Step 1: Send OTP via email
        await request(otpApp.getHttpServer())
          .post('/v1/otp/email')
          .set(TestUtils.createAuthHeader())
          .send({ email: 'integration@example.com' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.sendOneTimePasswordViaEmail).toHaveBeenCalledWith('integration@example.com');

        // Step 2: Verify the OTP
        mockOtpManagerService.validateOneTimePassword.mockResolvedValue(true);

        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'integration@example.com', code: '123456' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('integration@example.com', '123456');
      });

      it('should complete full SMS OTP flow: send, then verify', async () => {
        // Step 1: Send OTP via SMS
        await request(otpApp.getHttpServer())
          .post('/v1/otp/text-message')
          .set(TestUtils.createAuthHeader())
          .send({ phoneNumber: '+19876543210' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.sendOneTimePasswordViaSms).toHaveBeenCalledWith('+19876543210');

        // Step 2: Verify the OTP
        mockOtpManagerService.validateOneTimePassword.mockResolvedValue(true);

        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: '+19876543210', code: '654321' })
          .expect(201)
          .expect('ok');

        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('+19876543210', '654321');
      });

      it('should handle incorrect OTP verification after sending', async () => {
        // Step 1: Send OTP
        await request(otpApp.getHttpServer())
          .post('/v1/otp/email')
          .set(TestUtils.createAuthHeader())
          .send({ email: 'wrongcode@example.com' })
          .expect(201)
          .expect('ok');

        // Step 2: Try to verify with wrong code
        mockOtpManagerService.validateOneTimePassword.mockResolvedValue(false);

        await request(otpApp.getHttpServer())
          .post('/v1/otp/verify')
          .set(TestUtils.createAuthHeader())
          .send({ identifier: 'wrongcode@example.com', code: '000000' })
          .expect(201)
          .expect('fail');

        expect(mockOtpManagerService.validateOneTimePassword).toHaveBeenCalledWith('wrongcode@example.com', '000000');
      });
    });
  });
});