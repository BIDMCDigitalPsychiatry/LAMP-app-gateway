import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { DispatcherService } from './dispatcher.service';
import { DemoNotificationsController } from './controllers/v1/demo-notifications.controller';
import { GenericPushNotificationsController } from './controllers/v1/generic-push-notifications.controller';
import { OneTimePasswordsController } from './controllers/v1/one-time-passwords.controller';
import { AwsEndUserMessagingService } from './providers/aws-end-user-messaging.service';
import { AwsEmailService } from './providers/aws-email.service';
import { OtpManagerService } from './services/one-time-password/otp-manager.service';
import { OtpStorageService } from './services/one-time-password/otp-storage.service';
import { OtpService } from './services/one-time-password/otp.service';

@Module({
  imports: [],
  controllers: [DemoNotificationsController, GenericPushNotificationsController, OneTimePasswordsController],
  providers: [
    FirebaseMessagingService,
    ApplePushNotificationService,
    DispatcherService,
    AwsEndUserMessagingService,
    AwsEmailService,
    OtpService,
    OtpManagerService,
    OtpStorageService
  ],
  exports: [
  ],
})
export class NotificationsModule {}
