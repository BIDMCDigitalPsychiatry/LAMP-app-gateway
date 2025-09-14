import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";


export interface MessageReceivedNoteParams {}

export class MessageReceivedNote implements Message {

  constructor(_: MessageReceivedNoteParams) {
    this.title = "Message Received"
    this.body = "Someone has sent you a message"
    this.apnsExpiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    this.apnsPriority = ApnsPriority.SEND_IMMEDIATELY
  }

  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;

  readonly title: string;
  readonly body: string;

}
