import express from "express";
import * as Sentry from '@sentry/node';

import config from "./config";

import ServiceInfoController from "./controllers/service-info.controller";
import FirebaseMessagingServiceImpl from "./services/firebase-messaging.service";
import DemoNotificationsController from "./controllers/demo-notifications.controller";
import ApplePushNotificationServiceImpl from "./services/apple-push-notification.service";

//=============================================================================
// App
//=============================================================================

const app = express();

// -- { global middleware -- non-error-handling } -----------------------------

app.use(express.json());

// -- { services } ------------------------------------------------------------

const firebaseMessagingService = new FirebaseMessagingServiceImpl(config.firebase)
const applePushNotificationService = new ApplePushNotificationServiceImpl(config.apns)

// -- { controllers } ---------------------------------------------------------

const demoNotificationsController = new DemoNotificationsController(
  applePushNotificationService,
  firebaseMessagingService
)

// -- { routes } --------------------------------------------------------------

app.post('/test-apns', demoNotificationsController.sendDemoApnsNote)
app.post('/test-firebase', demoNotificationsController.sendDemoFirebaseNote)

app.get('/', ServiceInfoController.healthz);
app.get("/system/healthz", ServiceInfoController.healthz);
app.get("/system/readyz", ServiceInfoController.readyz);
app.get("/system/metrics", ServiceInfoController.metrics);
app.get("/system/version", ServiceInfoController.version)

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// -- { global middleware -- error-handling } ---------------------------------
//
//   According to the sentry setup instructions, all global error-handling
//   middleware should be declared after all the application's express routes
//   have been declared -- AND -- Sentry must be the first of the global error
//   handlers. This allows sentry to see all errors and report on whether or not
//   errors were handled by downstream error handling middleware, if any.
//
//   https://docs.sentry.io/platforms/javascript/guides/express/#apply-instrumentation-to-your-app
Sentry.setupExpressErrorHandler(app);

export default app;