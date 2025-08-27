import express from "express";
import * as Sentry from '@sentry/node';

import config from "./config";

import ServiceInfoController from "./controllers/service-info.controller";
import FirebaseMessagingServiceImpl from "./services/firebase-messaging.service";

//=============================================================================
// App
//=============================================================================

const app = express();

// -- { global middleware -- non-error-handling } -----------------------------

app.use(express.json());

// -- { services } ------------------------------------------------------------

const firebaseMessagingService = new FirebaseMessagingServiceImpl({
  serviceAccountJsonPath: config.firebase.serviceAccount.path
})

// -- { controllers } ---------------------------------------------------------


// -- { routes } --------------------------------------------------------------


app.get('/', ServiceInfoController.healthz);
app.get("/metrics", ServiceInfoController.metrics);
app.get("/healthz", ServiceInfoController.healthz);
app.get("/readyz", ServiceInfoController.readyz);

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