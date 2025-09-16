import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { NotificationsController } from './notifications.controller';
import { DispatcherService } from './dispatcher.service';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    FirebaseMessagingService,
    ApplePushNotificationService,
    DispatcherService
  ],
  exports: [
  ],
})
export class NotificationsModule {}