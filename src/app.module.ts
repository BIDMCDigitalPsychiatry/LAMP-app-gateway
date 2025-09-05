import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { schema } from './config/app.config';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SystemModule } from './modules/system/system.module';
import { SentryModule } from "@sentry/nestjs/setup";
import apnsConfig from './modules/notifications/config/apns.config';
import firebaseConfig from './modules/notifications/config/firebase.config';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './guards/api-key.guard';


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
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}