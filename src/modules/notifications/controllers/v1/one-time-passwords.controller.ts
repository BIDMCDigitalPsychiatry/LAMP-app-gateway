import { Body, Controller, Post } from '@nestjs/common';
import { SendOtpViaEmailPayload, SendOtpViaTextMessagePayload, VerifyOtpPayload } from '../../schemas/one-time-passwords-controller-requests';
import { OtpManagerService } from '../../services/one-time-password/otp-manager.service';

@Controller('v1/otp')
export class OneTimePasswordsController {

  constructor(
    private readonly manager: OtpManagerService,
  ) {}

  @Post('/email')
  async sendOtpViaEmail(@Body() payload: SendOtpViaEmailPayload): Promise<string> {
    await this.manager.sendOneTimePasswordViaEmail(payload.email)
    return "ok"
  }

  @Post('/text-message')
  async sendOtpViaTextMessage(@Body() payload: SendOtpViaTextMessagePayload): Promise<string> {
    await this.manager.sendOneTimePasswordViaSms(payload.phoneNumber)
    return "ok"
  }
  
  @Post('/verify')
  async verifyOtp(@Body() payload: VerifyOtpPayload): Promise<string> {
    const isValid = await this.manager.validateOneTimePassword(payload.identifier, payload.code)
    return (isValid ? "ok" : "fail" )
  }

}
