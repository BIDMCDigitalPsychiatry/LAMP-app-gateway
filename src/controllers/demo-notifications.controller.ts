import { Request, Response } from "express";
import { ApplePushNotificationService } from "../services/apple-push-notification.service";
import { FirebaseMessagingService } from "../services/firebase-messaging.service";

const {
  DEMO_DEVICE_ID_ANDROID,
  DEMO_DEVICE_ID_IOS
} = process.env;

export default class DemoNotificationsController {
  private readonly apns: ApplePushNotificationService;
  private readonly firebase: FirebaseMessagingService;

  constructor(
    apns: ApplePushNotificationService,
    firebase: FirebaseMessagingService
  ) {
    this.apns = apns;
    this.firebase = firebase;
  }

  sendDemoApnsNote = async (req: Request, res: Response) : Promise<void> => {
    if (! DEMO_DEVICE_ID_IOS) {
      console.warn("Env var `DEMO_DEVICE_ID_IOS` is not set. Skipping demo ios push notification.")
      res.status(403).end()
      return
    }

    await this.apns.sendDemoNotification(DEMO_DEVICE_ID_IOS)
    res.send("ok")
    return
  }

  sendDemoFirebaseNote = async (req: Request, res: Response) : Promise<void> => {
    if (! DEMO_DEVICE_ID_ANDROID) {
      console.warn("Env var `DEMO_DEVICE_ID_ANDROID` is not set. Skipping demo firebase push notification.")
      res.status(403).end()
      return
    }
    await this.firebase.sendDemoNotification(DEMO_DEVICE_ID_ANDROID)
    res.send("ok")
    return
  }
}