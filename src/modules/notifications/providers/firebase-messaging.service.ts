import { Inject, Injectable, Logger } from '@nestjs/common';
import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging, Notification, TokenMessage } from 'firebase-admin/messaging';
import firebaseConfig from '../config/firebase.config';
import { Message, IMessagingService, NotificationDestination, MessageDispatchResult } from '../domain';
import { invariant } from '../../../utils/invariant';

export type FirebaseToken = string;

export interface FirebaseConfig {
  serviceAccountFileContents: string
}

@Injectable()
export class FirebaseMessagingService implements IMessagingService {
  private readonly messaging: Messaging;
  private readonly logger = new Logger(FirebaseMessagingService.name);

  constructor(
    @Inject(firebaseConfig.KEY)
    private config: FirebaseConfig
  ) {
    const app = initializeApp({
      credential: cert(JSON.parse(config.serviceAccountFileContents))
    });
    this.messaging = getMessaging(app);
  }

  async sendMessage({ service, token }: NotificationDestination, message: Message): Promise<MessageDispatchResult> {
    invariant(service === "firebase", `Message intended for '${service}' delivery, not Firebase`)

    const tokenMessage : TokenMessage = {
      token,
      notification: this.toFirebaseNotification(message)
    }

    this.logger.log(`Sending ${message.type}(${message.id}) via Firebase Messaging`)
    try {
      const result = await this.messaging.send(tokenMessage)
      return {
        messageId: message.id,
        vendorMessageId: result,
        successful: true
      }
    } catch(err) {
      this.logger.error(`Sending ${message.type}(${message.id}) failed`, err)
      return {
        messageId: message.id,
        vendorMessageId: undefined,
        successful: false
      }
    }
  }

  private toFirebaseNotification(msg: Message) : Notification {
    return {
      body: msg.body,
      title: msg.title
    }
  }
}
