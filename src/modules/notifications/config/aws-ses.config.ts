import { registerAs } from "@nestjs/config";
import { AwsEmailServiceConfig } from "../providers/aws-email.service";

// TODO: ensure env vars are validated in joi schema
export default registerAs('aws-ses', (): AwsEmailServiceConfig => {
  const {
    AWS_SES_REGION,
    AWS_SES_EMAIL_ADDR_REPLY_TO,
    AWS_SES_EMAIL_ADDR_SENDER,
    AWS_SES_TEMPLATE_SUFFIX
    // AWS_SES_,
  } = process.env;

  // Environment variables are now validated by the central Joi schema in app.config.ts
  // so we can safely assume they exist and are valid at this point
  return {
    region: AWS_SES_REGION!,
    replyToAddress: AWS_SES_EMAIL_ADDR_REPLY_TO!,
    senderEmailAddress: AWS_SES_EMAIL_ADDR_SENDER!,
    templateSuffix: AWS_SES_TEMPLATE_SUFFIX!,
  }
})