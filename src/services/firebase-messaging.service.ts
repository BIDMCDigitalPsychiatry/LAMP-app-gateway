// ----------------------------------------------------------------------------
// Developer Note
// ----------------------------------------------------------------------------
// Documentation for Firebase-Admin's `initializeApp` can be found here:
// https://firebase.google.com/docs/reference/admin/node/firebase-admin.app
//
// See also details about making authenticated calls outside of the Application
// Default Credentials chain:
// https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments
// ----------------------------------------------------------------------------

import { cert, initializeApp } from 'firebase-admin/app';

import { getMessaging, Messaging, TokenMessage } from 'firebase-admin/messaging';

export type FirebaseToken = string

export interface FirebaseMessageContent {
  title: string,
  body: string
}

export interface FirebaseConfig {
  serviceAccountFileContents: string
}

export interface FirebaseMessagingService {
  sendPush(deviceId: FirebaseToken, content: FirebaseMessageContent): Promise<string>,
  sendDemoNotification(deviceId: FirebaseToken): Promise<string>
}

export default class FirebaseMessagingServiceImpl implements FirebaseMessagingService {
  private readonly messaging: Messaging;

  constructor(config: FirebaseConfig) {
    const app = initializeApp({
      credential: cert(JSON.parse(config.serviceAccountFileContents))
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

  async sendDemoNotification(token: FirebaseToken): Promise<string> {
    const message : TokenMessage = {
      token,
      notification: {
        body: "Demo message body content",
        title: "Demo message Title"
      }
    }
    return await this.messaging.send(message)
  }
}