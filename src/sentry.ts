import * as Sentry from "@sentry/node";

const {
  SENTRY_DSN,
  SENTRY_ENV,
  ORG_OPENCONTAINERS_IMAGE_VERSION
} = process.env;

if (!! SENTRY_DSN) {
  const config : Sentry.NodeOptions = {
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
  }

  if (!! SENTRY_ENV) {
    config['environment'] = SENTRY_ENV
  }

  if (!! ORG_OPENCONTAINERS_IMAGE_VERSION) {
    config['release'] = ORG_OPENCONTAINERS_IMAGE_VERSION
  }

  Sentry.init(config);
  console.log('Sentry initialized')
}
