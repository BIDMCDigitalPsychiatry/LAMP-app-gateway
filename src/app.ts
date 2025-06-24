#!/usr/bin/env node

import express from "express";

import config from "./config";

import ServiceInfoController from "./controllers/service-info.controller";
import LegacyNotificationsController from "./controllers/legacy-notifications.controller";
import LegacyNotificationsService from "./services/legacy-notifications.service";
import LegacyLogController from "./controllers/legacy-log.controller";

//=============================================================================
// App
//=============================================================================

const app = express();

// -- { global middleware } ---------------------------------------------------

app.use(express.json());

// -- { services } ------------------------------------------------------------

const legacyNotificationsService = new LegacyNotificationsService(config);

// -- { controllers } ---------------------------------------------------------

const legacyLogController = new LegacyLogController(config, legacyNotificationsService)
const legacyNotificationsController = new LegacyNotificationsController(config, legacyNotificationsService)

// -- { routes } --------------------------------------------------------------

app.put('/', express.text({type: '*/*'}), legacyLogController.log)
app.put('/log', express.text({type: '*/*'}), legacyLogController.log)

app.post('/push', legacyNotificationsController.push)

app.get('/', ServiceInfoController.healthz);
app.get("/metrics", ServiceInfoController.metrics);
app.get("/healthz", ServiceInfoController.healthz);
app.get("/readyz", ServiceInfoController.readyz);


export default app;