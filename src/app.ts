#!/usr/bin/env node
import * as http2 from "http2";
import * as jwt from "jsonwebtoken";
import * as aws from 'aws-sdk';
import express from "express";

import config from "./config";

//=============================================================================
// Types
//=============================================================================

interface APNSPayload {
  aps?: {
    id?: string;
    'push-type'?: string;
    expiration?: string;
    'collapse-id'?: string;
  };
  [key: string]: any;
}

interface GCMPayload {
  [key: string]: any;
}

interface EmailPayload {
  from?: string;
  cc?: string;
  subject?: string;
  body?: string;
}

interface SMSPayload {
  text: string;
}

interface SlackPayload {
  content?: string;
}

interface PushRequest {
  api_key?: string;
  device_token: string;
  push_type?: 'apns' | 'gcm' | 'mailto' | 'sms' | 'slack';
  payload: APNSPayload | GCMPayload | EmailPayload | SMSPayload | SlackPayload;
}

interface LogRequest {
  origin?: string;
  level?: string;
  stream?: string;
}

//=============================================================================
// Config
//=============================================================================

const SES = new aws.SES();		
const SNS = new aws.SNS();

//=============================================================================
// Gateway Implementation
//=============================================================================

const app = express();

// Send an APNS push using `certificate` to `device` containing `payload`.
async function APNSpush(certificate: P8Certificate, device: string, payload: APNSPayload): Promise<string> {
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
	
	// Development: https://api.sandbox.push.apple.com:443
	// Production: https://api.push.apple.com:443
	const client = http2.connect(config.deprecated.APNS_ENDPOINT);
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
async function GCMpush(certificate: string, device: string, payload: GCMPayload): Promise<any> {
	const client = http2.connect(config.deprecated.GCM_PUSH_ENDPOINT);
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
async function SESpush(email: string, payload: EmailPayload): Promise<aws.SES.SendEmailResponse> {
	return SES.sendEmail({
		Source: config.deprecated.AWS_SES_FROM,
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
async function SNSpush(number: string, payload: SMSPayload): Promise<aws.SNS.PublishResponse> {
	return SNS.publish({
		Message: payload.text,
		PhoneNumber: number,
	}).promise();
}

// Send a Slack message to a predefined channel/webhook.
async function SLACKpush(hook: string, message: SlackPayload): Promise<string> {
	const client = http2.connect(config.deprecated.SLACK_PUSH_ENDPOINT);
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

// The microservice driver code.
app.post('/push', express.json(), async (req: express.Request<{}, {}, PushRequest>, res: express.Response) => {
	
	// First verify each parameter type.
	// Note: "push_type" can be embedded in "device_token" like so: "<push_type>:<device_token>".
	const verify0 = config.deprecated.API_KEYS.length === 0 || config.deprecated.API_KEYS.includes(req.body['api_key'] || '');
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
			await APNSpush(config.deprecated.APNS_P8, req.body['device_token'], req.body['payload'] as APNSPayload);
		else if (req.body['push_type'] === 'gcm')
			await GCMpush(config.deprecated.GCM_AUTH, req.body['device_token'], req.body['payload'] as GCMPayload);
		else if (req.body['push_type'] === 'mailto')
			await SESpush(req.body['device_token'], req.body['payload'] as EmailPayload);
		else if (req.body['push_type'] === 'sms')
			await SNSpush(req.body['device_token'], req.body['payload'] as SMSPayload);
		else if (req.body['push_type'] === 'slack')
			await SLACKpush(req.body['device_token'], req.body['payload'] as SlackPayload);
		return res.status(200).json({});
	} catch(e) {
		return res.status(400).json({ "error": e || "unknown error occurred" });
	}
});

// Logging driver code. Note: For legacy compatibility, routing to `/` is enabled.
// Try it using: `http PUT :3000 origin==test level==info <<<'testing log!'`
app.put(['/log', '/'], express.text({type: '*/*'}), async (req: express.Request<{}, {}, string, LogRequest>, res: express.Response) => {
	
	// Some types of logging messages are not allowed (PHI, etc.)
	if (typeof req.body !== 'string' || req.body.includes("Protected health data is inaccessible"))
		return res.status(200).json({ "warning": "log message was ignored" });
	
	// Shortcut for sending a slack message instead of a log. [DEPRECATED]
	if (req.query.stream === 'slack') {
		await SLACKpush(config.deprecated.SLACK_HOOK, { content: (req.body || '').trim() });
		return res.status(200).json({ "destination": "slack" });
	} else {
		console.log(`[${req.query.level || 'info'}] [${req.query.origin || 'unknown'}] ${(req.body || '').trim()}`);
		return res.status(200).json({});
	}
});

// Ping for healthchecks.
app.get('/', (req: express.Request, res: express.Response) => res.status(200).json({ ok: true }));
app.get("/metrics", (req: express.Request, res: express.Response) => res.status(200).json({ ok: true }).end());
app.get("/healthz", (req: express.Request, res: express.Response) => res.status(200).json({ ok: true }).end());
app.get("/readyz", (req: express.Request, res: express.Response) => res.status(200).json({ ok: true }).end());

export default app;