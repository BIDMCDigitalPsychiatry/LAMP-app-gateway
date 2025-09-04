import { registerAs } from "@nestjs/config";
import { ApnsConfig } from "../apple-push-notification.service";

export default registerAs('apns', (): ApnsConfig => {
  const {
    APNS_KEY_FILE_BASE64,
    APNS_KEY_ID,
    APNS_TEAM_ID,
    APNS_BUNDLE_ID,
    APNS_USE_PRODUCTION_ENDPOINT,
  } = process.env;

  // Environment variables are now validated by the central Joi schema in app.config.ts
  // so we can safely assume they exist and are valid at this point
  return {
    keyFileContents: Buffer.from(APNS_KEY_FILE_BASE64!, 'base64').toString('utf8'),
    keyId: APNS_KEY_ID!,
    teamId: APNS_TEAM_ID!,
    bundleId: APNS_BUNDLE_ID!,
    isProduction: APNS_USE_PRODUCTION_ENDPOINT === "true"
  }
})