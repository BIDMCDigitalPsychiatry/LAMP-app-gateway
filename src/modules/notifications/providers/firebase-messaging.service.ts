import { Inject, Injectable } from '@nestjs/common';
import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging, Notification, TokenMessage } from 'firebase-admin/messaging';
import firebaseConfig from '../config/firebase.config';
import { Message, IMessagingService, NotificationDestination } from '../domain';
import { invariant } from '../../../utils/invariant';

export type FirebaseToken = string;

export interface FirebaseConfig {
  serviceAccountFileContents: string
}

@Injectable()
export class FirebaseMessagingService implements IMessagingService {
  private readonly messaging: Messaging;

  constructor(
    @Inject(firebaseConfig.KEY)
    private config: FirebaseConfig
  ) {
    const app = initializeApp({
      credential: cert(JSON.parse(config.serviceAccountFileContents))
    });
    this.messaging = getMessaging(app);
  }

  async sendMessage({ service, token }: NotificationDestination, message: Message): Promise<void> {
    invariant(service === "firebase", `Message intended for '${service}' delivery, not Firebase`)

    const tokenMessage : TokenMessage = {
      token,
      notification: this.toFirebaseNotification(message)
    }

    await this.messaging.send(tokenMessage)
    return
  }

  private toFirebaseNotification(msg: Message) : Notification {
    return {
      body: msg.body,
      title: msg.title
    }
  }
}
