import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging, Messaging, TokenMessage } from 'firebase-admin/messaging';

export type FirebaseToken = string

export interface FirebaseMessageContent {
  title: string,
  body: string
}

interface FirebaseMessagingServiceImplConfig {
  serviceAccountJsonPath: string 
}

export interface FirebaseMessagingService {
  sendPush(deviceId: FirebaseToken, content: FirebaseMessageContent): Promise<string>
}

export default class FirebaseMessagingServiceImpl implements FirebaseMessagingService {
  private readonly messaging: Messaging;

  constructor(config: FirebaseMessagingServiceImplConfig) {
    const app = initializeApp({
      credential: cert(require(config.serviceAccountJsonPath))
    })
    this.messaging = getMessaging(app)
  }

  async sendPush(token: FirebaseToken, content: FirebaseMessageContent): Promise<string> {
    const message : TokenMessage = {
      token,
      notification: {
        body: content.body,
        title: content.title
      }
    }
    return await this.messaging.send(message)
  }
}