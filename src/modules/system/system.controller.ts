import { Controller, Get } from '@nestjs/common';

@Controller()
export class SystemController {
  @Get('/')
  healthz() {
    return { ok: true };
  }

  @Get('/system/healthz')
  systemHealthz() {
    return { ok: true };
  }

  @Get('/system/readyz')
  readyz() {
    return { ok: true };
  }

  @Get('/system/metrics')
  metrics() {
    return "";
  }

  @Get('/system/version')
  version() {
    const {
      ORG_OPENCONTAINERS_IMAGE_VERSION,
      ORG_OPENCONTAINERS_IMAGE_REVISION,
      ORG_OPENCONTAINERS_IMAGE_CREATED
    } = process.env;

    return {
      version: ORG_OPENCONTAINERS_IMAGE_VERSION,
      revision: ORG_OPENCONTAINERS_IMAGE_REVISION,
      created: {
        utc: ORG_OPENCONTAINERS_IMAGE_CREATED,
      }
    };
  }

  @Get('/debug-sentry')
  debugSentry() {
    throw new Error("My first Sentry error!");
  }
}