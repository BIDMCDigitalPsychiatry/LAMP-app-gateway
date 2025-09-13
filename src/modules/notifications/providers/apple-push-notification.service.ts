import { Inject, Injectable } from '@nestjs/common';

import { Notification, Provider } from "@parse/node-apn";
import apnsConfig from '../config/apns.config';
import { Message, IMessagingService, NotificationDestination } from '../domain';
import { invariant } from '../../../utils/invariant';

var apn = require('@parse/node-apn');

export type DeviceToken = string;

export interface ApnsConfig {
  keyFileContents: string,
  keyId: string,
  teamId: string,
  bundleId: string,
  isProduction: boolean
}

@Injectable()
export class ApplePushNotificationService implements IMessagingService {
  private readonly connection: Provider;
  private readonly topic: string;

  constructor(
    @Inject(apnsConfig.KEY)
    private config: ApnsConfig
  ) {
    
    var options = {
      token: {
        key: config.keyFileContents,
        keyId: config.keyId,
        teamId: config.teamId
      },
      production: config.isProduction
    };

    this.topic = config.bundleId;
    this.connection = new apn.Provider(options);
  }

  async sendMessage({ service, token }: NotificationDestination, message: Message): Promise<void> {
    invariant(service === "apns", `Message intended for '${service}' delivery, not APNs`)

    await this.connection.send(this.toApnsNotification(message), token);

    return
  }

  public async sendDemoNotification(deviceId: DeviceToken) {
    const note: Notification = new Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";

    try {
      await this.connection.send(note, deviceId);
    } catch (error) {
      console.error("Error sending apns note: ", error);
    }

    return null;
  }

  private toApnsNotification(msg: Message) : Notification {
    return new Notification({
      pushType: "alert",
      topic: this.topic,
      title: msg.title,
      body: msg.body,

      expiry: Math.floor(Date.now() / 1000) + 3600, // Expires 1 hour from now.
      badge: 3,
      sound: "ping.aiff",
      alert: "\uD83D\uDCE7 \u2709 You have a new message"
    })
  }
}
