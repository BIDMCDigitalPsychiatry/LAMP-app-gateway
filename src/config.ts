
//=============================================================================
// Helper Functions
//=============================================================================

import { ApnsConfig } from "./services/apple-push-notification.service";
import { FirebaseConfig } from "./services/firebase-messaging.service";

function isEmpty(str: string | undefined): boolean {
  return !str || str.length === 0;
}

//=============================================================================
// Config
//=============================================================================

const {
  APNS_KEY_FILE_BASE64,
  APNS_KEY_ID,
  APNS_TEAM_ID,
  APNS_USE_PRODUCTION_ENDPOINT,
  FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
} = process.env;


// --{ API_KEYS }--------------------------------------------------------------
//
// `API_KEYS` is an array of allow-listed keys for request senders, stored as a
// comma-separatated list (i.e. "n1WHtGTpRByGjeOP,k6ToHy9lmUZB7LzZ") Requests
// missing an API Key or using an API Key not found in this array will be
// blocked.
//
// To generate an API Key in the terminal: `openssl rand -base64 12`
// ----------------------------------------------------------------------------
const API_KEYS: string[] = (process.env.API_KEYS || "").split(",").filter(x => x.length > 0);

if (
  isEmpty(APNS_KEY_FILE_BASE64) ||
  isEmpty(APNS_KEY_ID) ||
  isEmpty(APNS_TEAM_ID) ||
  isEmpty(APNS_USE_PRODUCTION_ENDPOINT) ||
  isEmpty(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64)
) {
  console.error("Missing required environment variables(s)");
  process.exit(-1);
}

//=============================================================================
// Validate
//=============================================================================

export interface Config {
  auth: {
    bearer: {
      keyWhitelist: string[]
    }
  },
  port: number;
  // aws: {
  //   ses: {
  //     region: string,
  //     fromAddress: string
  //   }
  // },
  firebase: FirebaseConfig,
  apns: ApnsConfig
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  auth: {
    bearer: {
      keyWhitelist: API_KEYS
    }
  },
  // aws: {
  //   ses: {
  //     region: "us-east-1",
  //     fromAddress: process.env.AWS_SES_ADDRESS || ""
  //   }
  // },
  firebase: {
    serviceAccountFileContents: Buffer.from(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 as string, 'base64').toString('utf8')
  },
  apns: {
    keyFileContents: Buffer.from(APNS_KEY_FILE_BASE64 as string, 'base64').toString('utf8'),
    keyId: APNS_KEY_ID as string,
    teamId: APNS_TEAM_ID as string,
    isProduction: APNS_USE_PRODUCTION_ENDPOINT == "true"
  },
};

export default config;