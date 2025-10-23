import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";
import { BaseMessage } from "./base-message";

export interface ActivityReminderNoteParams {}

export class ActivityReminderNote extends BaseMessage implements Message {
  constructor(_: ActivityReminderNoteParams) {
    super({
      title: "Activity waiting",
      body: "You have an activity awaiting completion",
      expiresAt: Math.floor(Date.now() / 1000) + 3600 // Expires 1 hour from now.
    })
    this.opts.apns = {
      priority: ApnsPriority.RESPECT_BATTERY_STATE
    }
  }
}
