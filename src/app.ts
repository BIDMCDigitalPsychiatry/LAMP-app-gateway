#!/usr/bin/env node

import express from "express";

import config from "./config";
import LegacyService, { APNSPayload, EmailPayload, GCMPayload, LogRequest, PushRequest, SlackPayload, SMSPayload } from "./services/legacy.service";

//=============================================================================
// Gateway Implementation
//=============================================================================

const app = express();

const legacyService = new LegacyService(config);


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
			await legacyService.APNSpush(config.deprecated.APNS_P8, req.body['device_token'], req.body['payload'] as APNSPayload);
		else if (req.body['push_type'] === 'gcm')
			await legacyService.GCMpush(config.deprecated.GCM_AUTH, req.body['device_token'], req.body['payload'] as GCMPayload);
		else if (req.body['push_type'] === 'mailto')
			await legacyService.SESpush(req.body['device_token'], req.body['payload'] as EmailPayload);
		else if (req.body['push_type'] === 'sms')
			await legacyService.SNSpush(req.body['device_token'], req.body['payload'] as SMSPayload);
		else if (req.body['push_type'] === 'slack')
			await legacyService.SLACKpush(req.body['device_token'], req.body['payload'] as SlackPayload);
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
		await legacyService.SLACKpush(config.deprecated.SLACK_HOOK, { content: (req.body || '').trim() });
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