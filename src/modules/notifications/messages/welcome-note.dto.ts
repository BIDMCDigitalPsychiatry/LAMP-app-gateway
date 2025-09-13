import { Message } from "../domain";


export interface WelcomeNoteParams {}

export class WelcomeNote implements Message {

  constructor(_: WelcomeNoteParams) {
    this.title = "Welcome!"
    this.body = "Welcome to LAMP"
  }

  readonly title: string;
  readonly body: string;

}
