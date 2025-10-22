# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LAMP-app-gateway is a NestJS-based notification and logging gateway service for the LAMP platform. It handles push notifications via Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs), and SMS via AWS End User Messaging.

## Development Commands

### Setup and Running
```bash
npm install                    # Install dependencies
npm run dev                    # Run dev server with hot reload (uses .env via dotenv-cli)
npm run build                  # Compile TypeScript to dist/
npm start                      # Run compiled app from dist/
```

### Testing
```bash
npm test                       # Run unit tests (*.spec.ts)
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report
npm run test:debug            # Run tests with verbose output
npm run test:e2e              # Run e2e tests (*.e2e-spec.ts)
```

### Running Individual Tests
```bash
# Run specific test file
dotenv -e .env.test -- jest src/path/to/file.spec.ts

# Run tests matching pattern
dotenv -e .env.test -- jest --testNamePattern="pattern"
```

## Architecture

### Module Structure

The application uses NestJS modules organized by domain:

- **NotificationsModule** (`src/modules/notifications/`): Core notification functionality
  - **Controllers**: Handle HTTP endpoints for different notification types
    - `GenericPushNotificationsController`: Generic push notification endpoint
    - `DemoNotificationsController`: Demo/test notifications
    - `OneTimePasswordsController`: OTP SMS delivery
  - **DispatcherService**: Routes notifications to appropriate provider (APNs, Firebase, AWS SMS)
  - **Providers**: Platform-specific messaging implementations
    - `ApplePushNotificationService`: APNs integration using @parse/node-apn
    - `FirebaseMessagingService`: FCM integration using firebase-admin
    - `AwsEndUserMessagingService`: SMS via AWS Pinpoint SMS Voice V2
  - **Messages**: Typed notification templates (WelcomeNote, ActivityReminderNote, MessageReceivedNote, DemoNote)

- **SystemModule** (`src/modules/system/`): Health checks and metrics
  - Endpoints: `/system/healthz`, `/system/readyz`, `/system/metrics`

### Global Configuration

Configuration is managed via NestJS ConfigModule with Joi validation:
- **src/config/app.config.ts**: Main app config (port, API keys, auth)
- **src/modules/notifications/config/apns.config.ts**: APNs configuration
- **src/modules/notifications/config/firebase.config.ts**: Firebase configuration
- **src/modules/notifications/config/aws-sms.config.ts**: AWS SMS configuration

All environment variables are validated at startup using Joi schemas. Base64-encoded secrets (FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, APNS_KEY_FILE_BASE64) are decoded in config modules.

### Authentication

Global API key authentication via `ApiKeyGuard`:
- Requires `Authorization: Bearer <api-key>` header
- API keys configured via `API_KEYS` environment variable (comma-separated)
- Public paths (healthz, readyz) exempt from authentication

### Notification Flow

1. Request arrives at controller endpoint
2. Controller validates request using Zod schemas (via nestjs-zod)
3. Controller calls `DispatcherService` with typed notification destination and parameters
4. `DispatcherService` routes to appropriate provider (APNs/Firebase/AWS SMS) based on `NotificationDestination.service`
5. Provider sends message and returns `MessageDispatchResult`

The `NotificationDestination` type is a discriminated union:
```typescript
type NotificationDestination = ApnsDestination | FirebaseDestination
```

### Observability

- **Logging**: Structured logging via nestjs-pino with request ID tracking
- **Error tracking**: Sentry integration (must be loaded first in main.ts)
- **Health checks**: `/system/healthz` and `/system/readyz` endpoints

### Environment Configuration

.env files are NOT loaded by NestJS ConfigModule (`ignoreEnvFile: true`). They are loaded via `dotenv-cli` wrapper for local development and tests only. Production environments (Docker/ECS) must set environment variables before process launch.

Test configuration: `.env.test` contains test values for all required environment variables.

## Important Patterns

### Adding a New Notification Type

1. Create message DTO in `src/modules/notifications/messages/` extending base Message interface
2. Add method to `IDispatcherService` interface in `domain.ts`
3. Implement method in `DispatcherService`
4. Add controller endpoint or extend existing controller

### Adding a New Provider

1. Create service in `src/modules/notifications/providers/` implementing `IMessagingService`
2. Add config module in `src/modules/notifications/config/`
3. Register config in `AppModule.imports` ConfigModule.load array
4. Add validation schema in `src/config/app.config.ts`
5. Register provider in `NotificationsModule.providers`
6. Update `DispatcherService.destinations` mapping
7. Extend `NotificationDestination` type union in `domain.ts`

### Base64 Encoding for Secrets

Variables ending in `_BASE64` must be base64 encoded before setting in environment:

```bash
# OSX - encode file
openssl base64 -A -in input_file | pbcopy

# Linux - encode file
base64 -w 0 input_file | xclip -selection clipboard
```

Use RFC 4648 base64 encoding. Decode in Node using: `Buffer.from(base64String, 'base64').toString('utf8')`

## Testing Notes

- Unit tests use `.spec.ts` suffix (jest.config.js)
- E2E tests use `.e2e-spec.ts` suffix (test/jest-e2e.json)
- Test setup in `src/test/setup.ts`
- All tests use `.env.test` environment variables via dotenv-cli
- Mock service accounts and credentials in .env.test are safe for testing

## Build and Deployment

TypeScript compiles to `dist/` directory. Strict mode enabled with comprehensive checks:
- `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`
- `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `noUncheckedIndexedAccess`, `noImplicitOverride`

Target: ES2020, Module: CommonJS
