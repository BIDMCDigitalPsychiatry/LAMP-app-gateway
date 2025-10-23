import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";
import { BaseMessage } from "./base-message";

function getCurrentDatetimeString(): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: 'full',
    timeStyle: 'medium'
  })
  return formatter.format(Date.now())
}

export class DemoNote extends BaseMessage implements Message {
  constructor() {
    super({
      title: "Message Title",
      body: "Demo message body content",
      expiresAt: Math.floor(Date.now() / 1000) + 3600 // Expires 1 hour from now.
    })
    this.opts.apns = {
      priority: ApnsPriority.SEND_IMMEDIATELY
    }
  }
}
