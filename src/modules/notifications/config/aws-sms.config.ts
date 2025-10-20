import { registerAs } from "@nestjs/config";
import { AwsEndUserMessagingConfig } from "../providers/aws-end-user-messaging.service";

// TODO: ensure env vars are validated in joi schema
export default registerAs('aws-sms', (): AwsEndUserMessagingConfig => {
  const {
    AWS_SMS_CONFIG_SET_NAME,
    AWS_SMS_ORIGINATION_IDENTITY,
  } = process.env;

  // Environment variables are now validated by the central Joi schema in app.config.ts
  // so we can safely assume they exist and are valid at this point
  return {
    configSetName: AWS_SMS_CONFIG_SET_NAME!,
    originationIdentity: AWS_SMS_ORIGINATION_IDENTITY!,
  }
})