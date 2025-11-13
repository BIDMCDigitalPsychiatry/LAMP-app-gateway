import { Injectable } from '@nestjs/common';
import { Email, PhoneNumber } from '../../domain';
import { OneTimePassword, OtpService } from './otp.service';
import { OneTimePasswordNote } from '../../messages/one-time-password-note.dto';
import { AwsEndUserMessagingService } from '../../providers/aws-end-user-messaging.service';
import { AwsEmailService } from '../../providers/aws-email.service';
import { OtpStorageService } from './otp-storage.service';

type Identifier = Email | PhoneNumber

@Injectable()
export class OtpManagerService {

  constructor(
    private readonly smsService: AwsEndUserMessagingService,
    private readonly emailService: AwsEmailService,
    private readonly otps: OtpService,
    private readonly otpStorage: OtpStorageService
  ){}

  public async sendOneTimePasswordViaSms(number: PhoneNumber) : Promise<void> {
    const code = await this.issueOneTimePassword(number)
    await this.smsService.sendMessage(number, new OneTimePasswordNote({ code }))
  }

  public async sendOneTimePasswordViaEmail(email: Email) : Promise<void> {
    const code = await this.issueOneTimePassword(email)
    await this.emailService.sendMessage(email, new OneTimePasswordNote({ code }))
  }

  public async validateOneTimePassword(identifier: Identifier, candidate: OneTimePassword) : Promise<boolean> {
    const hash = await this.otpStorage.fetch(identifier)

    if (hash) {
      const isMatch = (await this.otps.verifyOneTimePassword(candidate, hash))
      if (isMatch) {
        await this.otpStorage.removeAllFor(identifier)
        return true
      }
    }

    return false
  }

  private async issueOneTimePassword(identifier: Identifier) : Promise<OneTimePassword> {
    const { code, hash, exp } = await this.otps.generateOneTimePassword()

    await this.otpStorage.removeAllFor(identifier)
    await this.otpStorage.save(identifier, hash, exp)

    return code
  }
}

