import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { DispatcherService } from './dispatcher.service';
import { DemoNotificationsController } from './controllers/demo-notifications.controller';
import { GenericPushNotificationsController } from './controllers/generic-push-notifications.controller';
import { OneTimePasswordsController } from './controllers/one-time-passwords.controller';

@Module({
  imports: [],
  controllers: [DemoNotificationsController, GenericPushNotificationsController, OneTimePasswordsController],
  providers: [
    FirebaseMessagingService,
    ApplePushNotificationService,
    DispatcherService
  ],
  exports: [
  ],
})
export class NotificationsModule {}