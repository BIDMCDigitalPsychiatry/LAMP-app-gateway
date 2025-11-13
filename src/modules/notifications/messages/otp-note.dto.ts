import { Message } from "../domain";
import { BaseMessage } from "./base-message";

export interface OtpNoteParams {
  code: string
}

export class OtpNote extends BaseMessage implements Message {
  constructor(params: OtpNoteParams) {
    super({
      title: "",
      body: `Your one time password from mindlamp is ${params.code}`,
      expiresAt: Math.floor(Date.now() / 1000) + 900 // Expires 15 mins from now.
    })
    this.opts.ses = {
      templateName: "OTP_EMAIL",
      templateData: {
        code: params.code
      }
    }
  }
}
