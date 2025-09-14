import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { schema } from './config/app.config';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SystemModule } from './modules/system/system.module';
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import apnsConfig from './modules/notifications/config/apns.config';
import firebaseConfig from './modules/notifications/config/firebase.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';


@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,

      // Note: .env is loaded using the cli tool, not nest's config-module. We
      // do this so .env files are not mistakenly used in docker or ecs
      // environments. Those environments should set env variables before
      // process-launch.
      ignoreEnvFile: true,
      load: [
        apnsConfig,
        configuration,
        firebaseConfig
      ],
      validationSchema: schema,
      validationOptions: {
        // allowUnknown: false,
        // validatePredefined: false,
        abortEarly: false
      },
    }),
    NotificationsModule,
    SystemModule,
  ],
  providers: [
    // Note: SentryGlobalFilter must be the first provider in the list. I
    // suspect this allows it to defer to specialized filters defined later in
    // the list which will have precidence.
    //
    // See
    // https://docs.sentry.io/platforms/javascript/guides/nestjs/#not-using-a-custom-global-filter
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}