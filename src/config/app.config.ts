import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export interface AppConfig {
  port: number
  host: string
  auth: {
    bearer: {
      keyWhitelist: string[]
    },
    publicPaths: string[]
  }
}

export const schema = Joi.object({
  // App configuration
  API_KEYS: Joi.string().required().custom((value, helpers) => {
    const keys = value.split(',').filter((x: string) => x.length > 0);
    
    if (keys.length === 0) {
      return helpers.error('At least one API key must be provided');
    }
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!key.match(/^[a-zA-Z0-9]+$/)) {
        return helpers.error('api_keys.invalid_chars', { key, index: i });
      }
      if (key.length < 12) {
        return helpers.error('api_keys.too_short', { key, index: i });
      }
    }
    
    return value;
  }).messages({
    'any.required': 'API_KEYS environment variable is required',
    'api_keys.invalid_chars': 'API_KEYS[{{#index}}]: "{{#key}}" contains non-alphanumeric characters. Only letters and numbers are allowed.',
    'api_keys.too_short': 'API_KEYS[{{#index}}]: "{{#key}}" is too short. API keys must be at least 12 characters long.'
  }),
  PORT: Joi.number().port().default(3000),

  // APNS configuration
  APNS_KEY_FILE_BASE64: Joi.string().required().base64().messages({
    'any.required': 'APNS_KEY_FILE_BASE64 environment variable is required',
    'string.base64': 'APNS_KEY_FILE_BASE64 must be a valid base64 encoded string'
  }),
  APNS_KEY_ID: Joi.string().required().alphanum().length(10).messages({
    'any.required': 'APNS_KEY_ID environment variable is required',
    'string.alphanum': 'APNS_KEY_ID must contain only alphanumeric characters',
    'string.length': 'APNS_KEY_ID must be exactly 10 characters long'
  }),
  APNS_TEAM_ID: Joi.string().required().alphanum().length(10).messages({
    'any.required': 'APNS_TEAM_ID environment variable is required',
    'string.alphanum': 'APNS_TEAM_ID must contain only alphanumeric characters',
    'string.length': 'APNS_TEAM_ID must be exactly 10 characters long'
  }),
  APNS_BUNDLE_ID: Joi.string().required().pattern(/^[a-zA-Z0-9.-]+$/).messages({
    'any.required': 'APNS_BUNDLE_ID environment variable is required',
    'string.pattern.base': 'APNS_BUNDLE_ID must be a valid bundle identifier (e.g., com.example.app)'
  }),
  APNS_USE_PRODUCTION_ENDPOINT: Joi.string().valid('true', 'false').default('false').messages({
    'any.only': 'APNS_USE_PRODUCTION_ENDPOINT must be either "true" or "false"'
  }),

  // Firebase configuration
  FIREBASE_SERVICE_ACCOUNT_JSON_BASE64: Joi.string().required().base64().messages({
    'any.required': 'FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 environment variable is required',
    'string.base64': 'FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 must be a valid base64 encoded string'
  })
})

export default registerAs('app', (): AppConfig => {
  const {
    API_KEYS,
    PORT
  } = process.env;

  // Environment variables are now validated by the central Joi schema
  // so we can safely assume they exist and are valid at this point
  const apiKeys: string[] = API_KEYS!.split(",").filter(x => x.length > 0);
  
  console.log('Valid API keys loaded:', apiKeys.length)

  return {
    port: Number(PORT) || 3000,
    host: "0.0.0.0",
    auth: {
      bearer: {
        keyWhitelist: apiKeys
      },
      publicPaths: [
        "/system/healthz",
        "/system/readyz"
      ]
    },
  };
});