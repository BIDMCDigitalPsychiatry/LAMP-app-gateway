

import { Request, Response } from "express";
import LegacyNotificationService from "../services/legacy-notifications.service";
import { Config } from "../config";
import { FirebaseMessageContent, FirebaseMessagingService } from "../services/firebase-messaging.service";


export interface APNSPayload {
  aps?: {
    id?: string;
    'push-type'?: string;
    expiration?: string;
    'collapse-id'?: string;
  };
  [key: string]: any;
}

// TODO: We don't actually know the shape of the data coming in here. We'll want
// to update the 'FirebaseNotificationAdapter' to accommodate
export interface GCMPayload {
  [key: string]: any;
}

export interface EmailPayload {
  from?: string;
  cc?: string;
  subject?: string;
  body?: string;
}

export interface SMSPayload {
  text: string;
}

export interface SlackPayload {
  content?: string;
}

interface PushRequest {
  api_key?: string;
  device_token: string;
  push_type?: 'apns' | 'gcm' | 'mailto' | 'sms' | 'slack';
  payload: APNSPayload | GCMPayload | EmailPayload | SMSPayload | SlackPayload;
}

class FirebaseNotificationAdapter {
  private readonly title: string;
  private readonly body: string;

  constructor(message: GCMPayload) {
    this.title = message.title || "<undefined>"
    this.body = message.body || "<undefined>"
  }

  public asFirebaseMessageContent(): FirebaseMessageContent {
    return {
      title: this.title,
      body: this.body
    }
  }
}

export default class LegacyNotificationsController {
  private readonly legacyNotificationService: LegacyNotificationService;
  private readonly firebaseMessagingService: FirebaseMessagingService;
  private readonly config: Config;
  
  constructor(config: Config, legacyNotificationService: LegacyNotificationService, firebaseMessagingService: FirebaseMessagingService) {
    this.legacyNotificationService = legacyNotificationService
    this.config = config;
    this.firebaseMessagingService = firebaseMessagingService;
  }


  public async push(req: Request<{}, {}, PushRequest>, res: Response) {

    // First verify each parameter type.
    // Note: "push_type" can be embedded in "device_token" like so: "<push_type>:<device_token>".
    const verify0 = this.config.deprecated.API_KEYS.length === 0 || this.config.deprecated.API_KEYS.includes(req.body['api_key'] || '');
    const verify1 = typeof req.body['device_token'] === "string";
    const verify2 = ["apns", "gcm", "mailto", "sms", "slack"].includes(req.body['push_type'] || '');
    const verify2a = verify1 && ["apns", "gcm", "mailto", "sms", "slack"].includes(req.body['device_token'].split(/:(.+)/, 2)[0] || '');
    const verify3 = typeof req.body['payload'] === "object";
    if (!verify0)
      return res.status(400).json({ "error": "bad request: valid api_key is required" });
    else if (!verify1)
      return res.status(400).json({ "error": "bad request: device_token must be a string" });
    else if (!verify2 && !verify2a)
      return res.status(400).json({ "error": "bad request: push_type must be one of ['apns', 'gcm', 'mailto', 'sms', 'slack']" });
    else if (!verify3)
      return res.status(400).json({ "error": "bad request: payload must be an object" });
    if (verify2a) {
      const pieces = req.body['device_token'].split(/:(.+)/, 2);
      req.body['push_type'] = pieces[0] as 'apns' | 'gcm' | 'mailto' | 'sms' | 'slack';
      req.body['device_token'] = pieces[1] || '';
    }
    
    // We've verified the parameters, now invoke the push calls.
    try {
      if (req.body['push_type'] === 'apns')
        await this.legacyNotificationService.APNSpush(this.config.deprecated.APNS_P8, req.body['device_token'], req.body['payload'] as APNSPayload);
      else if (req.body['push_type'] === 'gcm')
        await this.firebaseMessagingService.sendPush(
          req.body['device_token'],
          new FirebaseNotificationAdapter(req.body['payload']).asFirebaseMessageContent()
        )
      else if (req.body['push_type'] === 'mailto')
        await this.legacyNotificationService.SESpush(req.body['device_token'], req.body['payload'] as EmailPayload);
      else if (req.body['push_type'] === 'sms')
        await this.legacyNotificationService.SNSpush(req.body['device_token'], req.body['payload'] as SMSPayload);
      else if (req.body['push_type'] === 'slack')
        await this.legacyNotificationService.SLACKpush(req.body['device_token'], req.body['payload'] as SlackPayload);
      return res.status(200).json({});
    } catch(e) {
      return res.status(400).json({ "error": e || "unknown error occurred" });
    }
  }
}