import { Controller, Post, UseGuards } from '@nestjs/common';
import { EnvRequirementGuard } from '../../../guards/env-requirement.guard';
import { invariant } from '../../../utils/invariant';
import { DispatcherService } from '../dispatcher.service';
import { AwsEndUserMessagingService, SIMULATOR_PHONE_NUMBERS } from '../providers/aws-end-user-messaging.service';
import { DemoNote } from '../messages/demo-note.dto';
import { AwsEmailService } from '../providers/aws-email.service';

@Controller('demo')
export class DemoNotificationsController {

  private readonly demoDeviceIdAndroid: string | null;
  private readonly demoDeviceIdIos: string | null;
  private readonly demoEmailAddr: string | null;
  
  constructor(
    private readonly dispatcher: DispatcherService,
    private readonly smsService: AwsEndUserMessagingService,
    private readonly emailService: AwsEmailService,
  ) {
    this.demoDeviceIdAndroid = process.env.DEMO_DEVICE_ID_ANDROID || null;
    this.demoDeviceIdIos = process.env.DEMO_DEVICE_ID_IOS || null;
    this.demoEmailAddr = process.env.DEMO_EMAIL_ADDR || null
  }

  @Post('/test-apns')
  @UseGuards(new EnvRequirementGuard('DEMO_DEVICE_ID_IOS'))
  async sendDemoApnsNote(): Promise<string> {
    invariant((this.demoDeviceIdIos !== null), "Cannot send APNs demo notification if `DEMO_DEVICE_ID_IOS` is not set")

    await this.dispatcher.sendDemoNote({
      service: "apns",
      token: this.demoDeviceIdIos
    })

    return "ok";
  }

  @Post('/test-firebase')
  @UseGuards(new EnvRequirementGuard('DEMO_DEVICE_ID_ANDROID'))
  async sendDemoFirebaseNote(): Promise<string> {
    invariant((this.demoDeviceIdAndroid !== null), "Cannot send Firebase demo notification if `DEMO_DEVICE_ID_ANDROID` is not set")

    await this.dispatcher.sendDemoNote({
      service: "firebase",
      token: this.demoDeviceIdAndroid
    })

    return "ok";
  }

  @Post('/test-sms')
  async sendDemoSmsNote(): Promise<string> {
    await this.smsService.sendMessage(SIMULATOR_PHONE_NUMBERS.US.SUCCESS, new DemoNote())

    return "ok";
  }

  @Post('/test-email')
  @UseGuards(new EnvRequirementGuard('DEMO_EMAIL_ADDR'))
  async sendDemoEmailNote(): Promise<string> {
    invariant((this.demoEmailAddr !== null), "Cannot send demo notification via email if `DEMO_EMAIL_ADDR` is not set")

    await this.emailService.sendMessage(this.demoEmailAddr, new DemoNote())

    return "ok";
  }

}
