import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";


export interface WelcomeNoteParams {}

export class WelcomeNote implements Message {

  constructor(_: WelcomeNoteParams) {
    this.title = "Welcome!"
    this.body = "Welcome to LAMP"
    this.apnsExpiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    this.apnsPriority = ApnsPriority.RESPECT_BATTERY_STATE
  }

  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;

  readonly title: string;
  readonly body: string;

}
