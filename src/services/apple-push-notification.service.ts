import { Notification, Provider } from "@parse/node-apn";

var apn = require('@parse/node-apn');

export type DeviceToken = string


interface PushNotificationContent {

}

export interface ApnsConfig {
  keyFileContents: string,
  keyId: string,
  teamId: string,
  bundleId: string,
  isProduction: boolean
}

export interface ApplePushNotificationService {
  sendPush(deviceId: DeviceToken, content: PushNotificationContent): Promise<null>
  sendDemoNotification(deviceId: DeviceToken): Promise<null>
}

export default class ApplePushNotificationServiceImpl implements ApplePushNotificationService {

  private readonly connection: Provider;
  private readonly topic: string;

  constructor(config: ApnsConfig) {
    var options = {
      token: {
        key: config.keyFileContents,
        keyId: config.keyId,
        teamId: config.teamId
      },
      production: config.isProduction
    };

    this.topic = config.bundleId
    this.connection = new apn.Provider(options);
  }

  public async sendPush(deviceId: DeviceToken, notification: Notification) {
    try {
      await this.connection.send(notification, deviceId);
    } catch (error) {
      console.error("Error sending apns note: ", error)
    }

    return null
  }

  public async sendDemoNotification(deviceId: DeviceToken) {
    const note : Notification = new Notification()

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = {'messageFrom': 'John Appleseed'};
    note.topic = this.topic;

    try {
      await this.connection.send(note, deviceId);
    } catch (error) {
      console.error("Error sending apns note: ", error)
    }

    return null
  }
}