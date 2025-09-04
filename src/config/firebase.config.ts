import { registerAs } from "@nestjs/config";
import { FirebaseConfig } from "../modules/notifications/firebase-messaging.service";

const {
  FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
} = process.env;

export default registerAs('firebase', (): FirebaseConfig => {
  return {
    serviceAccountFileContents: Buffer.from(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 as string, 'base64').toString('utf8')
  }
})