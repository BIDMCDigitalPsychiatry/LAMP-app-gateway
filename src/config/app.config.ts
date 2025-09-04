import { registerAs } from '@nestjs/config';

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
}

export default registerAs('app', (): AppConfig => {
  const {
    API_KEYS,
    PORT
  } = process.env;

  const apiKeys: string[] = (API_KEYS || "").split(",").filter(x => x.length > 0);

  return {
    port: Number(PORT) || 3000,
    host: "0.0.0.0",
    auth: {
      bearer: {
        keyWhitelist: apiKeys
      }
    },
  };
});