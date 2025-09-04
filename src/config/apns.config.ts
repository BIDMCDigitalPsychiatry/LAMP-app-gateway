import { registerAs } from "@nestjs/config";
import { ApnsConfig } from "../modules/notifications/apple-push-notification.service";

  const {
    APNS_KEY_FILE_BASE64,
    APNS_KEY_ID,
    APNS_TEAM_ID,
    APNS_BUNDLE_ID,
    APNS_USE_PRODUCTION_ENDPOINT,
  } = process.env;

export default registerAs('apns', (): ApnsConfig => {
  return {
    keyFileContents: Buffer.from(APNS_KEY_FILE_BASE64 as string, 'base64').toString('utf8'),
    keyId: APNS_KEY_ID as string,
    teamId: APNS_TEAM_ID as string,
    bundleId: APNS_BUNDLE_ID as string,
    isProduction: APNS_USE_PRODUCTION_ENDPOINT == "true"
  }
})