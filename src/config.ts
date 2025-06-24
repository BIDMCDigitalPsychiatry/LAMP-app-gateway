import dotenv from 'dotenv';

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

//=============================================================================
// Helper Functions
//=============================================================================

function isEmpty(str: string | undefined): boolean {
  return !str || str.length === 0;
}

//=============================================================================
// Config
//=============================================================================

// [DEPRECATED] Use the `/push` endpoint with a `slack:{hook}` device token.
// Only for Slack support. Format: "XXXXXXXXX/XXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX".
const SLACK_HOOK: string = process.env.SLACK_HOOK || "";

// Only for sending emails through AWS SES.
const AWS_SES_FROM: string = process.env.AWS_SES_FROM || "system@lamp.digital";

// API_KEYS is an optional array of allow-listed keys for request senders, 
// stored as a comma-separatated list (i.e. "n1WHtGTpRByGjeOP,k6ToHy9lmUZB7LzZ")
// If this array is set, requests missing an API Key or using an API Key 
// not found in this array will be blocked.
// To generate an API Key in the terminal: `openssl rand -base64 12`
const API_KEYS: string[] = (process.env.API_KEYS || "").split(",").filter(x => x.length > 0);

// APNS_AUTH and GCM_AUTH are certificate strings for accessing push servers.
// APNS_P8 is the filename of the APNS certificate required in the below format.
// APNS_P8 format: `${P8.teamID}_${P8.bundleID}_${P8.keyID}.p8`
const APNS_P8: string = process.env.APNS_P8 || "";
const APNS_AUTH: string = process.env.APNS_AUTH || "";
const GCM_AUTH: string = process.env.GCM_AUTH || "";

// DO NOT MODIFY THIS VARIABLE. See the above section instead.
// This certificate is constructed from the above APNS_P8 and APNS_AUTH.
const P8: P8Certificate = {
	teamID: APNS_P8.split("_", 3)[0] || "",
	bundleID: APNS_P8.split("_", 3)[1] || "",
	keyID: (APNS_P8.split("_", 3)[2] || "").split(".", 1)[0] || "",
	contents: `-----BEGIN PRIVATE KEY-----\n${(APNS_AUTH.match(/.{1,64}/g) || []).join("\n")}\n-----END PRIVATE KEY-----`
};


//=============================================================================
// Validate
//=============================================================================


if (isEmpty(APNS_P8) || isEmpty(APNS_AUTH) || isEmpty(GCM_AUTH)) {
  console.error("Missing required environment viriable(s)");
  process.exit(-1);
}

interface Config {
  port: number;
  aws: {
    ses: {
      region: string,
      fromAddress: string
    }
  },
  deprecated: {
    API_KEYS: string[],
    APNS_P8: P8Certificate,
    GCM_AUTH: string,
    SLACK_HOOK: string,
    AWS_SES_FROM: string,
    GCM_PUSH_ENDPOINT: string,
    SLACK_PUSH_ENDPOINT: string,
    APNS_ENDPOINT: string
  }
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  aws: {
    ses: {
      region: "us-east-1",
      fromAddress: process.env.AWS_SES_ADDRESS || ""
    }
  },
  deprecated: {
    API_KEYS: API_KEYS || [],
    APNS_P8: P8,
    GCM_AUTH,
    SLACK_HOOK,
    AWS_SES_FROM,
    GCM_PUSH_ENDPOINT: "https://fcm.googleapis.com:443/v1/projects/api-6882780734960683553-445906",
    SLACK_PUSH_ENDPOINT: `https://hooks.slack.com:443`,

    // Development: https://api.sandbox.push.apple.com:443
	  // Production: https://api.push.apple.com:443
    APNS_ENDPOINT: "https://api.push.apple.com:443"
  }
};

export default config;