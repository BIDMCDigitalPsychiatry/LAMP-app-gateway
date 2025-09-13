import { Message } from "../domain";

export interface ActivityReminderNoteParams {}

export class ActivityReminderNote implements Message {

  constructor(_: ActivityReminderNoteParams) {
    this.title = "Activity waiting"
    this.body = "You have an activity awaiting completion"
  }

  readonly title: string;
  readonly body: string;

}
