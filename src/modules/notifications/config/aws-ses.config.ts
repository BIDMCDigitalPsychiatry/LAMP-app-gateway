import { registerAs } from "@nestjs/config";
import { AwsSesConfig } from "../providers/aws-ses.service";

// TODO: ensure env vars are validated in joi schema
export default registerAs('aws-ses', (): AwsSesConfig => {
  const {
    // AWS_SES_,
    // AWS_SES_,
  } = process.env;

  // Environment variables are now validated by the central Joi schema in app.config.ts
  // so we can safely assume they exist and are valid at this point
  return {

  }
})