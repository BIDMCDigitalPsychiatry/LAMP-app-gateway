import { Controller, Post, HttpStatus, HttpException, Body, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { ApplePushNotificationService } from './apple-push-notification.service';
import { SendGenericActivityReminderRequest, SendGenericNewMessageNoteRequest, SendGenericWelcomeNoteRequest } from './dto';

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

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

  @Post('/generic/welcome')
  async sendGenericWelcomeNote(@Body req: SendGenericWelcomeNoteRequest): Promise<string> {
    switch (req.tokenType) {
      case "apns":
        return this.apnsService.sendPush();
      case "firebase":
        return this.firebaseService.sendPush()
      default:
        assertNever(req)
    }
    throw new NotImplementedException()
  }


  @Post('/generic/activity-reminder')
  async sendGenericActivityReminderNote(@Body sendGenericActivityReminderRequest: SendGenericActivityReminderRequest): Promise<string> {
    throw new NotImplementedException()
  }


  @Post('/generic/new-message')
  async sendGenericNewMessageNote(@Body sendGenericNewMessageNoteRequest: SendGenericNewMessageNoteRequest): Promise<string> {
    throw new NotImplementedException()
  }
}


// fetch("${NOTIFICATION_SERVICE_URL}/generic/new-message", {
//   method: "POST",
//   headers: {
//     Authorization: "Bearer: ${NOTIFICATION_SERVICE_API_KEY}"
//   },
//   data:  {
//     "tokenType": "firebase",
//     "deviceToken": "eEAR1YiGTkS_example_firebase_token_here...",
//     "senderName": "Dr. Smith"
//   }
// })



