import * as aws from 'aws-sdk';
import * as http2 from "http2";
import * as jwt from "jsonwebtoken";
import { Config } from '../config';

export interface APNSPayload {
  aps?: {
    id?: string;
    'push-type'?: string;
    expiration?: string;
    'collapse-id'?: string;
  };
  [key: string]: any;
}

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

export interface PushRequest {
  api_key?: string;
  device_token: string;
  push_type?: 'apns' | 'gcm' | 'mailto' | 'sms' | 'slack';
  payload: APNSPayload | GCMPayload | EmailPayload | SMSPayload | SlackPayload;
}

export interface LogRequest {
  origin?: string;
  level?: string;
  stream?: string;
}

export default class LegacyService {
  private readonly SES: aws.SES;
  private readonly SNS: aws.SNS;
  private readonly config: Config;
  
  constructor(config: Config) {
    this.SES = new aws.SES();
    this.SNS = new aws.SNS();
    this.config = config
  }

  // Send an APNS push using `certificate` to `device` containing `payload`.
  public async APNSpush(certificate: P8Certificate, device: string, payload: APNSPayload): Promise<string> {
    const TOKEN = jwt.sign({ 
      iss: certificate.teamID, iat: Math.floor(Date.now() / 1000) - 1 
    }, certificate.contents, {
      algorithm: "ES256",
      header: { alg: "ES256", kid: certificate.keyID }
    });
    const buffer = Buffer.from(JSON.stringify(payload));
    const HEADERS: http2.OutgoingHttpHeaders = {
      [':method']: 'POST',
      [':path']: `/3/device/${device}`,
      "Content-Type": "application/json",
      "Content-Length": buffer.length,
      "Authorization": `Bearer ${TOKEN}`,
      "apns-topic": certificate.bundleID,
      "apns-id": (payload['aps'] || {})['id'],
      "apns-push-type": (payload['aps'] || {})['push-type'],
      "apns-expiration": (payload['aps'] || {})['expiration'],
      "apns-collapse-id": (payload['aps'] || {})['collapse-id'],
    };

    const client = http2.connect(this.config.deprecated.APNS_ENDPOINT);
    const request = client.request(JSON.parse(JSON.stringify(HEADERS)));
    return new Promise((resolve, reject) => {
      const data: string[] = [];
      request.setEncoding('utf8');
      request.on('response', (headers) => {
        if (headers[':status'] !== 200)
          reject(new Error(`APNS request failed with status ${headers[':status']}`));
      });
      request.on('data', (chunk: string) => data.push(chunk));
      request.on('end', () => resolve(data.join()));
      request.write(buffer);
      request.end();
    });
  }

  // Send a Firebase (Google) push notification using `certificate` to the specified `device`.
  public async GCMpush(certificate: string, device: string, payload: GCMPayload): Promise<any> {
    const client = http2.connect(this.config.deprecated.GCM_PUSH_ENDPOINT);
    const buffer = Buffer.from(JSON.stringify({message:{
      ...payload, "token": device
    }}));
    const request = client.request({
      [':method']: 'POST',
      [':path']: `/messages:send`,
      "Content-Type": "application/json",
      "Content-Length": buffer.length,
      "Authorization": `Bearer ${certificate}`,
    });
    return new Promise((resolve, reject) => {
      const data: string[] = [];
      request.setEncoding('utf8');
      request.on('response', (headers) => {
        if (headers[':status'] !== 200)
          reject(new Error(`GCM request failed with status ${headers[':status']}`));
      });
      request.on('data', (chunk: string) => data.push(chunk));
      request.on('end', () => {
        try {
          const response = JSON.parse(data.join());
          if (response.success == 0)
            reject(response);
          else resolve(response);
        } catch (error) {
          reject(error);
        }	
      });
      request.write(buffer);
      request.end();
    });
  }

  // Send an email through AWS SES.
  public async SESpush(email: string, payload: EmailPayload): Promise<aws.SES.SendEmailResponse> {
    return this.SES.sendEmail({
      Source: this.config.deprecated.AWS_SES_FROM,
      ReplyToAddresses: typeof payload.from === 'string' ? payload.from.split(','): [],
      Destination: {
        ToAddresses: [email],
        CcAddresses: typeof payload.cc === 'string' ? payload.cc.split(','): [],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: typeof payload.subject === 'string' ? payload.subject: '',
        },
        Body: {
          /*Text: typeof payload.body !== 'string' ? undefined : {
            Charset: "UTF-8",
            Data: payload.body
          },*/
          Html: typeof payload.body !== 'string' ? undefined : {
            Charset: "UTF-8",
            Data: payload.body
          },
        },
      },
    }).promise();
  }

  // Send a text message through AWS SNS.
  public async SNSpush(number: string, payload: SMSPayload): Promise<aws.SNS.PublishResponse> {
    return this.SNS.publish({
      Message: payload.text,
      PhoneNumber: number,
    }).promise();
  }

  // Send a Slack message to a predefined channel/webhook.
  public async SLACKpush(hook: string, message: SlackPayload): Promise<string> {
    const client = http2.connect(this.config.deprecated.SLACK_PUSH_ENDPOINT);
    const buffer = Buffer.from(JSON.stringify({ text: message.content || "<no message body>" }));
    const request = client.request({
      [':method']: 'POST',
      [':path']: `/services/${hook}`,
      "Content-Type": "application/json",
      "Content-Length": buffer.length
    });
    return new Promise((resolve, reject) => {
      const data: string[] = [];
      request.setEncoding('utf8');
      request.on('response', (headers) => {
        if (headers[':status'] !== 200)
          reject(new Error(`Slack request failed with status ${headers[':status']}`));
      });
      request.on('data', (chunk: string) => data.push(chunk));
      request.on('end', () => resolve(data.join()));
      request.write(buffer);
      request.end();
    });
  }
}