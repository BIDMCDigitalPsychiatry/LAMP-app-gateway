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

  private toApnsNotification(msg: Message) : Notification {
    return new Notification({
      pushType: "alert",
      topic: this.topic,
      title: msg.title,
      body: msg.body,
      expiry: msg.apnsExpiry || 0
    })
  }
}

export enum ApnsPriority {
  SEND_IMMEDIATELY = 10,
  RESPECT_BATTERY_STATE = 5,
  PRIORITIZE_BATTERY_STATE = 1
}