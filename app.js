#!/usr/bin/env node
const http2 = require("http2")
const jwt = require("jsonwebtoken")
const aws = require('aws-sdk')
const express = require("express")
const cors = require("cors")
const { response } = require("express")
const app = express()
app.use(cors())
// Construct the AWS objects.
aws.config.update({
	region: process.env.AWS_SES_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY || "",
		secretAccessKey: process.env.AWS_SECRET_KEY || ""
	}
})
const SES = new aws.SES()		
const SNS = new aws.SNS()
 
// [DEPRECATED] Use the `/push` endpoint with a `slack:{hook}` device token.
// Only for Slack support. Format: "XXXXXXXXX/XXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX".
const SLACK_HOOK = process.env.SLACK_HOOK || ""

// Only for sending emails through AWS SES.
const AWS_SES_FROM = process.env.AWS_SES_FROM || "system@lamp.digital"

// API_KEYS is an optional array of allow-listed keys for request senders, 
// stored as a comma-separatated list (i.e. "n1WHtGTpRByGjeOP,k6ToHy9lmUZB7LzZ")
// If this array is set, requests missing an API Key or using an API Key 
// not found in this array will be blocked.
// To generate an API Key in the terminal: `openssl rand -base64 12`
const API_KEYS = (process.env.API_KEYS || "").split(",").filter(x => x.length > 0)

// APNS_AUTH and GCM_AUTH are certificate strings for accessing push servers.
// APNS_P8 is the filename of the APNS certificate required in the below format.
// APNS_P8 format: `${P8.teamID}_${P8.bundleID}_${P8.keyID}.p8`
const APNS_P8 = process.env.APNS_P8 || ""
const APNS_AUTH = process.env.APNS_AUTH || ""
const GCM_AUTH = process.env.GCM_AUTH || ""

// DO NOT MODIFY THIS VARIABLE. See the above section instead.
// This certificate is constructed from the above APNS_P8 and APNS_AUTH.
const P8 = {
	teamID: APNS_P8.split("_", 3)[0],
	bundleID: APNS_P8.split("_", 3)[1],
	keyID: (APNS_P8.split("_", 3)[2] || "").split(".", 1)[0],
	contents: `-----BEGIN PRIVATE KEY-----\n${(APNS_AUTH.match(/.{1,64}/g) || []).join("\n")}\n-----END PRIVATE KEY-----`
}

// Send an APNS push using `certificate` to `device` containing `payload`.
async function APNSpush(certificate, device, payload) {
	const TOKEN = jwt.sign({ 
		iss: certificate.teamID, iat: Math.floor(Date.now() / 1000) - 1 
	}, certificate.contents, {
		algorithm: "ES256",
		header: { alg: "ES256", kid: certificate.keyID }
	})
	const buffer = Buffer.from(JSON.stringify(payload))
	const HEADERS = {
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
	}
	
	// Development: https://api.sandbox.push.apple.com:443
	// Production: https://api.push.apple.com:443
	const client = http2.connect("https://api.push.apple.com:443")
	const request = client.request(JSON.parse(JSON.stringify(HEADERS)))
	return new Promise((resolve, reject) => {
		let data = []
		request.setEncoding('utf8')
		request.on('response', (headers) => {
			if (headers[':status'] !== 200)
				reject()
		})
		request.on('data', (chunk) => data.push(chunk))
		request.on('end', () => resolve(data.join()))
		request.write(buffer)
		request.end()
	})
}

// Send a Firebase (Google) push notification using `certificate` to the specified `device`.
async function GCMpush(certificate, device, payload) {
	const client = http2.connect("https://fcm.googleapis.com:443")
	const buffer = Buffer.from(JSON.stringify({
		...payload, "to": device
	}))
	const request = client.request({
		[':method']: 'POST',
		[':path']: `/fcm/send`,
		"Content-Type": "application/json",
		"Content-Length": buffer.length,
		"Authorization": `Bearer ${certificate}`,
	})
	return new Promise((resolve, reject) => {
		let data = []
		request.setEncoding('utf8')
		request.on('response', (headers) => {
			if (headers[':status'] !== 200)
				reject()
		})
		request.on('data', (chunk) => data.push(chunk))
		request.on('end', () => {
			try {
				let response = JSON.parse(data.join())
				if (response.success == 0)
					reject(response)
				else resolve(response)
			} catch (error) {
				reject(error)
			}	
		})
		request.write(buffer)
		request.end()
	})
}

// Send an email through AWS SES.
async function SESpush(email, payload) {
	return SES.sendEmail({
		Source: AWS_SES_FROM,
		ReplyToAddresses: typeof payload.from === 'string' ? payload.from.split(','): [],
		Destination: {
			ToAddresses: [email],
			CcAddresses: typeof payload.cc === 'string' ? payload.cc.split(','): [],
		},
		Message: {
			Subject: {
				Charset: 'UTF-8',
				Data: typeof payload.subject === 'string' ? payload.subject: null,
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
	}).promise()
}

// Send a text message through AWS SNS.
async function SNSpush(number, payload) {
	return SNS.publish({
		Message: payload.text,
		PhoneNumber: number,
	}).promise()
}

// Send a Slack message to a predefined channel/webhook.
async function SLACKpush(hook, message) {
	const client = http2.connect(`https://hooks.slack.com:443`)
	const buffer = Buffer.from(JSON.stringify({ text: message.content || "<no message body>" }))
	const request = client.request({
		[':method']: 'POST',
		[':path']: `/services/${hook}`,
		"Content-Type": "application/json",
		"Content-Length": buffer.length
	})
	return new Promise((resolve, reject) => {
		let data = []
		request.setEncoding('utf8')
		request.on('response', (headers) => {
			if (headers[':status'] !== 200)
				reject()
		})
		request.on('data', (chunk) => data.push(chunk))
		request.on('end', () => resolve(data.join()))
		request.write(buffer)
		request.end()
	})
}

// The microservice driver code.
app.post('/push', express.json(), async (req, res) => {
	
	// First verify each parameter type.
	// Note: "push_type" can be embedded in "device_token" like so: "<push_type>:<device_token>".
	let verify0 = API_KEYS.length === 0 || API_KEYS.includes(req.body['api_key'])
	let verify1 = typeof req.body['device_token'] === "string"
	let verify2 = ["apns", "gcm", "mailto", "sms", "slack"].includes(req.body['push_type'])
	let verify2a = verify1 && ["apns", "gcm", "mailto", "sms", "slack"].includes(req.body['device_token'].split(/:(.+)/, 2)[0])
	let verify3 = typeof req.body['payload'] === "object"
	if (!verify0)
		return res.status(400).json({ "error": "bad request: valid api_key is required" })
	else if (!verify1)
		return res.status(400).json({ "error": "bad request: device_token must be a string" })
	else if (!verify2 && !verify2a)
		return res.status(400).json({ "error": "bad request: push_type must be one of ['apns', 'gcm', 'mailto', 'sms', 'slack']" })
	else if (!verify3)
		return res.status(400).json({ "error": "bad request: payload must be an object" })
	if (verify2a) {
		let pieces = req.body['device_token'].split(/:(.+)/, 2)
		req.body['push_type'] = pieces[0]
		req.body['device_token'] = pieces[1]
	}
	
	// We've verified the parameters, now invoke the push calls.
	try {
		if (req.body['push_type'] === 'apns')
			await APNSpush(P8, req.body['device_token'], req.body['payload'])
		else if (req.body['push_type'] === 'gcm')
			await GCMpush(GCM_AUTH, req.body['device_token'], req.body['payload'])
		else if (req.body['push_type'] === 'mailto')
			await SESpush(req.body['device_token'], req.body['payload'])
		else if (req.body['push_type'] === 'sms')
			await SNSpush(req.body['device_token'], req.body['payload'])
		else if (req.body['push_type'] === 'slack')
			await SLACKpush(req.body['device_token'], req.body['payload'])
		return res.status(200).json({})
	} catch(e) {
		return res.status(400).json({ "error": e || "unknown error occurred" })
	}
})

// Logging driver code. Note: For legacy compatibility, routing to `/` is enabled.
// Try it using: `http PUT :3000 origin==test level==info <<<'testing log!'`
app.put(['/log', '/'], express.text({type: '*/*'}), async (req, res) => {
	
	// Some types of logging messages are not allowed (PHI, etc.)
	if (typeof req.body !== 'string' || req.body.includes("Protected health data is inaccessible"))
		return res.status(200).json({ "warning": "log message was ignored" })
	
	// Shortcut for sending a slack message instead of a log. [DEPRECATED]
	if (req.query.stream === 'slack') {
		let q = await SLACKpush(SLACK_HOOK, { content: (req.body || '').trim() })
		return res.status(200).json({ "destination": "slack" })
	} else {
		console.log(`[${req.query.level || 'info'}] [${req.query.origin || 'unknown'}] ${(req.body || '').trim()}`)
		return res.status(200).json({})
	}
})

// Ping for healthchecks.
app.get('/', (req, res) => res.status(200).json({ ok: true }))

// The utility function driver code.
async function main() {
	if (arguments.length < 3 || !['apns', 'gcm'].includes(arguments[0])) {
		console.log(`Usage: ./push.js <apns|gcm> <DEVICE_TOKEN> <PAYLOAD>`)
		console.log(`This utility allows you to push a JSON payload to a device with the mindLAMP app (either iOS or Android) installed.`)
		process.exit(-1)
	} else {
		try {
			if (arguments[0] === 'apns')
				await APNSpush(P8, arguments[1], JSON.parse(arguments[2]))
			else if (arguments[0] === 'gcm')
				await GCMpush(GCM_AUTH, arguments[1], JSON.parse(arguments[2]))
			else throw new Error('bad-platform')
			console.log('Successfully sent push notification.')
		} catch(e) {
			console.error('Failed to send push notification.')
			console.error(e)
		} finally {
			process.exit(0)
		}
	}	
}

// Verify our environment is set up correctly and run the driver code.
if (APNS_P8.length > 0 && APNS_AUTH.length > 0 && GCM_AUTH.length > 0) {
	
	// Start the HTTP server, or if running as a CLI, the driver function.
	app.listen(process.env.PORT || 3000)
	//main(...process.argv.slice(2))
} else {
	console.error("no APNS or GCM authorization specified")
	process.exit(-1)
}
