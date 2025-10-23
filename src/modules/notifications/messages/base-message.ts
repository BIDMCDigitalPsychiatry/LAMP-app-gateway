
import { randomUUID, UUID } from "crypto";
import { MessageOptions } from "../domain";

interface BaseMessageProps {
  title: string,
  body: string,
  expiresAt: number
}

export class BaseMessage {
 
    readonly id: UUID;
    readonly expiresAt: number;
    
    readonly title: string;
    readonly body: string;

    readonly opts: MessageOptions;

    constructor({ title, body, expiresAt }: BaseMessageProps) {
      this.id = randomUUID()
      this.title = title;
      this.body = body;
      this.expiresAt = expiresAt;
      this.opts = {}
    }
    
    get type(): string {
      return this.constructor.name
    }
}