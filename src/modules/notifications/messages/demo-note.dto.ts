import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";


export class DemoNote implements Message {

  constructor() {
    this.title = "Demo message Title!"
    this.body = "Demo message body content"
    this.apnsPriority = ApnsPriority.SEND_IMMEDIATELY
    this.apnsExpiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  }
  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;

  readonly title: string;
  readonly body: string;

}
