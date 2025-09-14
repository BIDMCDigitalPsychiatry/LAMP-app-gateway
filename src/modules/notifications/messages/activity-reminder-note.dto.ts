import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";

export interface ActivityReminderNoteParams {}

export class ActivityReminderNote implements Message {

  constructor(_: ActivityReminderNoteParams) {
    this.title = "Activity waiting"
    this.body = "You have an activity awaiting completion"
    this.apnsExpiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    this.apnsPriority = ApnsPriority.RESPECT_BATTERY_STATE
  }

  readonly title: string;
  readonly body: string;
  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;

}
