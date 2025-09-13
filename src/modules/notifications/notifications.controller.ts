import { Controller, Post, Body } from '@nestjs/common';
import { SendActivityReminderNotePayload, SendMessageReceivedNotePayload, SendWelcomeNotePayload } from './schemas/notification-controller-requests';
import { invariant } from '../../utils/invariant';
import { DispatcherService } from './dispatcher.service';

@Controller()
export class NotificationsController {
  private readonly demoDeviceIdAndroid: string | null;
  private readonly demoDeviceIdIos: string | null;

  constructor(
    private readonly dispatcher: DispatcherService,
  ) {
    this.demoDeviceIdAndroid = process.env.DEMO_DEVICE_ID_ANDROID || null;
    this.demoDeviceIdIos = process.env.DEMO_DEVICE_ID_IOS || null;
    this.dispatcher = dispatcher;
  }

  @Post('/test-apns')
  async sendDemoApnsNote(): Promise<string> {
    invariant((this.demoDeviceIdIos !== null), "Cannot send APNs demo notification if `DEMO_DEVICE_ID_IOS` is not set")

    await this.dispatcher.sendDemoNote({
      service: "apns",
      token: this.demoDeviceIdIos
    })

    return "ok";
  }

  @Post('/test-firebase')
  async sendDemoFirebaseNote(): Promise<string> {
    invariant((this.demoDeviceIdAndroid !== null), "Cannot send Firebase demo notification if `DEMO_DEVICE_ID_ANDROID` is not set")

    await this.dispatcher.sendDemoNote({
      service: "firebase",
      token: this.demoDeviceIdAndroid
    })

    return "ok";
  }

  @Post('/generic/welcome')
  async sendWelcomeNote(@Body() payload: SendWelcomeNotePayload): Promise<string> {
    await this.dispatcher.sendWelcomeNote(payload.destination, payload.options)
    return "ok"
  }


  @Post('/generic/activity-reminder')
  async sendActivityReminderNote(@Body() payload: SendActivityReminderNotePayload): Promise<string> {
    await this.dispatcher.sendActivityReminderNote(payload.destination, payload.options)
    return "ok"
  }


  @Post('/generic/new-message')
  async sendMessageReceivedNote(@Body() payload: SendMessageReceivedNotePayload): Promise<string> {
    await this.dispatcher.sendMessageReceivedNote(payload.destination, payload.options)
    return "ok"
  }
}

