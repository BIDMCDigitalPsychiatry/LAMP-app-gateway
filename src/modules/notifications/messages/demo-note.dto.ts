import { randomUUID, UUID } from "node:crypto";
import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";


export class DemoNote implements Message {

  constructor() {
    this.title = "Hi Matt it's Will"
    this.body = "Demo message body content"
    this.apnsPriority = ApnsPriority.SEND_IMMEDIATELY
    this.apnsExpiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    this.id = randomUUID()
    this.type = DemoNote.name
  }

  readonly id: UUID;
  readonly type: string;
  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;

  readonly title: string;
  readonly body: string;

}
