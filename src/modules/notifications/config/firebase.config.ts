import { registerAs } from "@nestjs/config";
import { FirebaseConfig } from "../firebase-messaging.service";

export default registerAs('firebase', (): FirebaseConfig => {
  const {
    FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
  } = process.env;

  // Environment variables are now validated by the central Joi schema in app.config.ts
  // so we can safely assume they exist and are valid at this point
  return {
    serviceAccountFileContents: Buffer.from(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64!, 'base64').toString('utf8')
  }
})