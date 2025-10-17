import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { NotificationsController } from './notifications.controller';
import { DispatcherService } from './dispatcher.service';
import { AwsEndUserMessagingService } from './providers/aws-end-user-messaging.service';
import { AwsSesService } from './providers/aws-ses.service';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    FirebaseMessagingService,
    ApplePushNotificationService,
    DispatcherService,
    AwsEndUserMessagingService,
    AwsSesService
  ],
  exports: [
  ],
})
export class NotificationsModule {}