import { Controller, Post, HttpStatus, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { ApplePushNotificationService } from './apple-push-notification.service';
import { AppConfig } from '../../config/configuration';

@Controller()
export class NotificationsController {
  private readonly demoDeviceIdAndroid: string | undefined;
  private readonly demoDeviceIdIos: string | undefined;

  constructor(
    private readonly firebaseService: FirebaseMessagingService,
    private readonly apnsService: ApplePushNotificationService,
    private readonly configService: ConfigService
  ) {
    this.demoDeviceIdAndroid = process.env.DEMO_DEVICE_ID_ANDROID;
    this.demoDeviceIdIos = process.env.DEMO_DEVICE_ID_IOS;
  }

  @Post('/test-apns')
  async sendDemoApnsNote(): Promise<string> {
    if (!this.demoDeviceIdIos) {
      console.warn("Env var `DEMO_DEVICE_ID_IOS` is not set. Skipping demo ios push notification.");
      throw new HttpException('DEMO_DEVICE_ID_IOS not configured', HttpStatus.FORBIDDEN);
    }

    await this.apnsService.sendDemoNotification(this.demoDeviceIdIos);
    return "ok";
  }

  @Post('/test-firebase')
  async sendDemoFirebaseNote(): Promise<string> {
    if (!this.demoDeviceIdAndroid) {
      console.warn("Env var `DEMO_DEVICE_ID_ANDROID` is not set. Skipping demo firebase push notification.");
      throw new HttpException('DEMO_DEVICE_ID_ANDROID not configured', HttpStatus.FORBIDDEN);
    }

    await this.firebaseService.sendDemoNotification(this.demoDeviceIdAndroid);
    return "ok";
  }
}