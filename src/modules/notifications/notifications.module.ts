import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { ApplePushNotificationService } from './apple-push-notification.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    FirebaseMessagingService,
    ApplePushNotificationService,
  ],
  exports: [
    FirebaseMessagingService,
    ApplePushNotificationService,
  ],
})
export class NotificationsModule {}