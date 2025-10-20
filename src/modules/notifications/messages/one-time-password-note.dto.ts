import { randomUUID, UUID } from "node:crypto";
import { Message } from "../domain";
import { ApnsPriority } from "../providers/apple-push-notification.service";

export interface OneTimePasswordNoteParams {
  code: string
}

export class OneTimePasswordNote implements Message {

  constructor({ code }: OneTimePasswordNoteParams) {
    this.title = "One Time Password"
    this.body = `Your one time password is ${code}`
    this.apnsExpiry = Math.floor(Date.now() / 1000) + 900; // Expires 15 min from now
    this.apnsPriority = ApnsPriority.SEND_IMMEDIATELY;
    this.id = randomUUID()
    this.type = OneTimePasswordNote.name
  }

  readonly type: string;
  readonly id: UUID;
  readonly title: string;
  readonly body: string;
  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;

}
