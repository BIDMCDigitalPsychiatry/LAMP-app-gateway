import { registerAs } from '@nestjs/config';
import { FirebaseConfig } from '../modules/notifications/firebase-messaging.service';
import { ApnsConfig } from '../modules/notifications/apple-push-notification.service';

function isEmpty(str: string | undefined): boolean {
  return !str || str.length === 0;
}

export interface AppConfig {
  port: number
  host: string
  auth: {
    bearer: {
      keyWhitelist: string[]
    }
  }
  firebase: FirebaseConfig
  apns: ApnsConfig
}

export default registerAs('app', (): AppConfig => {
  const {
    APNS_KEY_FILE_BASE64,
    APNS_KEY_ID,
    APNS_TEAM_ID,
    APNS_BUNDLE_ID,
    APNS_USE_PRODUCTION_ENDPOINT,
    FIREBASE_SERVICE_ACCOUNT_JSON_BASE64,
    API_KEYS,
    PORT
  } = process.env;

  // Validation
  if (
    isEmpty(APNS_KEY_FILE_BASE64) ||
    isEmpty(APNS_KEY_ID) ||
    isEmpty(APNS_TEAM_ID) ||
    isEmpty(APNS_BUNDLE_ID) ||
    isEmpty(APNS_USE_PRODUCTION_ENDPOINT) ||
    isEmpty(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64)
  ) {
    console.error("Missing required environment variables(s)");
    process.exit(-1);
  }

  const apiKeys: string[] = (API_KEYS || "").split(",").filter(x => x.length > 0);

  return {
    port: Number(PORT) || 3000,
    host: "0.0.0.0",
    auth: {
      bearer: {
        keyWhitelist: apiKeys
      }
    },
    firebase: {
      serviceAccountFileContents: Buffer.from(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 as string, 'base64').toString('utf8')
    },
    apns: {
      keyFileContents: Buffer.from(APNS_KEY_FILE_BASE64 as string, 'base64').toString('utf8'),
      keyId: APNS_KEY_ID as string,
      teamId: APNS_TEAM_ID as string,
      bundleId: APNS_BUNDLE_ID as string,
      isProduction: APNS_USE_PRODUCTION_ENDPOINT == "true"
    },
  };
});