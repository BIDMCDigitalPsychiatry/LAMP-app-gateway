import { Controller, Post, UseGuards } from '@nestjs/common';
import { EnvRequirementGuard } from '../../../guards/env-requirement.guard';
import { invariant } from '../../../utils/invariant';
import { DispatcherService } from '../dispatcher.service';

@Controller('demo')
export class DemoNotificationsController {

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

}
