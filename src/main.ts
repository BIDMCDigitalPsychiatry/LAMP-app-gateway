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


import 'reflect-metadata';

import * as Sentry from "@sentry/nestjs";
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';

const port = parseInt(process.env.PORT || '3000');
const host = "0.0.0.0"

export async function bootstrap() {
  try {
    console.log('LAMP - App Gateway (NestJS)');

    console.log(
      '-- { Phase: Wire Services } -------------------------------------------'
    );

    const app = await NestFactory.create(AppModule, {
      abortOnError: false
    });
    app.useGlobalFilters(new SentryExceptionFilter());
    app.enableShutdownHooks();
    
    console.log(
      '-- { Phase: Launch Server } -------------------------------------------'
    );
    
    await app.listen(port, host, () => {
      console.log(`Listening on ${host}:${port}`);
    });
    

    console.log(
      '-- { Phase: Runtime } -------------------------------------------------'
    );
    
    return app;
    
  } catch (error) {
    console.error('Failed to bootstrap NestJS application:', error);
    
    Sentry.captureException(error, {
      tags: {
        phase: 'bootstrap',
        component: 'nestjs-app'
      },
      level: 'fatal'
    });
    
    // Ensure Sentry has time to send the error before exit
    await Sentry.flush(2000);
    process.exit(1);
  }
}

bootstrap()