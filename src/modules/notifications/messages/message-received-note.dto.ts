import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";
import { BaseMessage } from "./base-message";

export interface MessageReceivedNoteParams {}

export class MessageReceivedNote extends BaseMessage implements Message {
  constructor(_: MessageReceivedNoteParams) {
    super({
      title: "Message Received",
      body: "Someone has sent you a message",
      expiresAt: Math.floor(Date.now() / 1000) + 3600 // Expires 1 hour from now.
    })
    this.opts.apns = {
      priority: ApnsPriority.SEND_IMMEDIATELY
    }
  }
}
