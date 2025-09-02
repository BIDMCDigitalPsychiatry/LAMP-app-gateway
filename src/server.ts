// -- { CRITICAL LOADING - START } --------------------------------------------
//
// Important: Ordering is important here. Sentry's node instrumentation portion
// should be the first thing to run in order to capture any errors that might
// occur loading our dependencies or wiring up the app.
// ----------------------------------------------------------------------------

import "./sentry";

// ----------------------------------------------------------------------------
// Now we can proceed loading all the rest of the world...
//
// -- { CRITICAL LOADING - END } ----------------------------------------------

import app from "./app";

//=============================================================================
// Config
//
// TODO: Move to config file
//=============================================================================

const PORT: number = parseInt(process.env.PORT || "3000");

// ---------------------
// Shutdown Grace Period
//
// Definition: the time between when the server stops accepting new requests and
//   when in-flight requests are forcibly terminated.
//
// Default: 2s Note: In our ECS environments we set this as close as is
// reasonable to the ECS grace period (30s). Other environments should consider
// a similar heuristic.
//
// Why is the default 5s? The default here is 2s for developer convinience. Some
// browsers .. ** cough, cough -- CHROME ** .. hold open phony "in-flight"
// requests, presumably for performance reasons. They'll send headers and
// request body once the client decides it has a request to actually send, but
// to the server, this phony open request looks like a legitimate open
// connection that has begun processing. So in development, err on the side of
// forcing connections to terminate early. In ECS environments, We should be
// insulated from this behavior by our load balancer.
const SHUTDOWN_GRACEPERIOD_MS: number = parseInt(
  process.env.SHUTDOWN_GRACEPERIOD_MS || "2000"
);

//=============================================================================
// Error Handling
//=============================================================================

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error(
    `Caught exception: ${error}\n` + `Exception origin: ${error.stack}`
  );
});


//=============================================================================
// Run
//=============================================================================

console.log("LAMP - App Gateway");
const server = app.listen(PORT, "0.0.0.0", () => {
  const address = server.address();
  if (address && typeof address === 'object') {
    console.log(`Listening on ${address.address}:${address.port}`);
  }
});
//main(...process.argv.slice(2))

//=============================================================================
// Signal Handling
//=============================================================================

server.on("error", (...args: any[]) => {
  console.error("Server error!", args);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received`);
  console.log("Shutting down.");
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log("Server exited successfully.");
      process.exit(0);
    }
  });
  setTimeout(() => {
    console.info("Forcibly terminating long-lived, in-flight connections");
    server.closeAllConnections();
  }, SHUTDOWN_GRACEPERIOD_MS);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);