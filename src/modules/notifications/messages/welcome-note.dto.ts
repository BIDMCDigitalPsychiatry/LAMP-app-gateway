import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";
import { BaseMessage } from "./base-message";

export interface WelcomeNoteParams {}

export class WelcomeNote extends BaseMessage implements Message {
  constructor(_: WelcomeNoteParams) {
    super({
      title: "Welcome!",
      body: "Welcome to LAMP",
      expiresAt: Math.floor(Date.now() / 1000) + 3600 // Expires 1 hour from now.
    })
    this.opts.apns = {
      priority: ApnsPriority.RESPECT_BATTERY_STATE
    }
  }
}
