import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { DispatcherService } from './dispatcher.service';
import { DemoNotificationsController } from './controllers/demo-notifications.controller';
import { GenericPushNotificationsController } from './controllers/generic-push-notifications.controller';
import { OneTimePasswordsController } from './controllers/one-time-passwords.controller';
import { AwsEndUserMessagingService } from './providers/aws-end-user-messaging.service';
import { AwsEmailService } from './providers/aws-email.service';

@Module({
  imports: [],
  controllers: [DemoNotificationsController, GenericPushNotificationsController, OneTimePasswordsController],
  providers: [
    FirebaseMessagingService,
    ApplePushNotificationService,
    DispatcherService,
    AwsEndUserMessagingService,
    AwsEmailService
  ],
  exports: [
  ],
})
export class NotificationsModule {}
