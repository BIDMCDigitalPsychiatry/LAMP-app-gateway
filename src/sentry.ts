import * as Sentry from "@sentry/node";

// Development Note: if you are using sentry in development, you must set the
// endpoint in your environment directly rather than adding it into your .env
// file. (Eg. 'export SENTRY_ENDPOINT=... && npm run dev') This is to make sure
// sentry is set-up to capture ALL errors that might occur in the boot sequence;
// even those that live in the dotenv machinery.

const { SENTRY_ENDPOINT } = process.env;

if (SENTRY_ENDPOINT) {
  Sentry.init({
    dsn: SENTRY_ENDPOINT,
    sendDefaultPii: true,
  });
  console.log('Sentry initialized')
}
