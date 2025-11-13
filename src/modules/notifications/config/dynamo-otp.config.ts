import { registerAs } from "@nestjs/config";
import { DynamoOtpRepositoryConfig } from "../services/one-time-password/otp-storage.service";


export default registerAs('dynamo-otp', (): DynamoOtpRepositoryConfig => {
  const {
    AWS_DYNAMO_OTP_REGION,
    AWS_DYNAMO_OTP_TABLE_NAME,
  } = process.env;

  // Environment variables are now validated by the central Joi schema in app.config.ts
  // so we can safely assume they exist and are valid at this point
  return {
    region: AWS_DYNAMO_OTP_REGION!,
    table: AWS_DYNAMO_OTP_TABLE_NAME!,
  }
})