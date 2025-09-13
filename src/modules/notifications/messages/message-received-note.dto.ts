import { Message } from "../domain";


export interface MessageReceivedNoteParams {}

export class MessageReceivedNote implements Message {

  constructor(_: MessageReceivedNoteParams) {
    this.title = "Message Received"
    this.body = "Someone has sent you a message"
  }

  readonly title: string;
  readonly body: string;

}
