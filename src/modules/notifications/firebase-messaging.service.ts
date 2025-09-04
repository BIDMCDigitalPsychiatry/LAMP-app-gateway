import { Inject, Injectable } from '@nestjs/common';
import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging, TokenMessage } from 'firebase-admin/messaging';
import firebaseConfig from './config/firebase.config';

export type FirebaseToken = string;

export interface FirebaseMessageContent {
  title: string;
  body: string;
}

export interface FirebaseConfig {
  serviceAccountFileContents: string
}

@Injectable()
export class FirebaseMessagingService {
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

  async sendPush(token: FirebaseToken, content: FirebaseMessageContent): Promise<string> {
    const message: TokenMessage = {
      token,
      notification: {
        body: content.body,
        title: content.title
      }
    };
    return await this.messaging.send(message);
  }

  async sendDemoNotification(token: FirebaseToken): Promise<string> {
    const message: TokenMessage = {
      token,
      notification: {
        body: "Demo message body content",
        title: "Demo message Title"
      }
    };
    return await this.messaging.send(message);
  }
}