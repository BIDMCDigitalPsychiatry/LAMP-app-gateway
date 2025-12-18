import { Message } from "../domain";
import { BaseMessage } from "./base-message";

export interface OneTimePasswordNoteParams {
  code: string
}

export class OneTimePasswordNote extends BaseMessage implements Message {
  constructor(params: OneTimePasswordNoteParams) {
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
