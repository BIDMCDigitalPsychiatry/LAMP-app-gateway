import { Message } from "../domain";


export class DemoNote implements Message {

  constructor() {
    this.title = "Demo message Title!"
    this.body = "Demo message body content"
  }

  readonly title: string;
  readonly body: string;

}
