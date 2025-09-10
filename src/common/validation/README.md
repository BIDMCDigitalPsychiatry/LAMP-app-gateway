# Request Validation Setup

This document explains the comprehensive request validation system implemented in the LAMP App Gateway using NestJS, class-validator, and class-transformer.

## Overview

The validation system provides:
- **Automatic request validation** against DTOs using decorators
- **Type transformation** from JSON to TypeScript classes
- **Custom device token validation** for APNs and Firebase
- **Structured error responses** for validation failures
- **Security through whitelisting** (unknown properties are stripped)

## Architecture

### 1. Global ValidationPipe Configuration

Located in: `src/main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Reject requests with extra properties
    transform: true,              // Transform to DTO instances
    disableErrorMessages: false,  // Keep detailed error messages
    transformOptions: {
      enableImplicitConversion: true, // Convert primitive types
    },
  }),
);
```

**Key Features:**
- **Security First**: Unknown properties are automatically stripped (`whitelist: true`)
- **Strict Validation**: Requests with forbidden properties are rejected (`forbidNonWhitelisted: true`)
- **Type Safety**: JSON payloads are transformed to DTO class instances (`transform: true`)
- **Developer Friendly**: Detailed validation error messages are preserved

### 2. Custom Device Token Validation

Located in: `src/common/validation/decorators/device-token.decorator.ts`

#### Available Decorators:

- `@IsApnsDeviceToken()` - Validates Apple Push Notification tokens
- `@IsFirebaseDeviceToken()` - Validates Firebase Cloud Messaging tokens  
- `@IsDeviceToken()` - Dynamic validation based on tokenType field

#### APNs Token Validation

Based on Apple's developer documentation, APNs device tokens are:
- Hexadecimal strings (0-9, a-f, A-F)
- Variable length (Apple: "Don't make assumptions about the device token length")
- Validated with reasonable bounds (8-512 characters)

#### Firebase Token Validation

Based on Firebase documentation, FCM registration tokens are:
- Base64url-encoded strings (A-Z, a-z, 0-9, -, _)
- Typically 140+ characters long
- No padding characters (= symbols)

### 3. DTO Structure

Located in: `src/modules/notifications/dto/`

#### Base DTO: `SendNoteRequest`
```typescript
export class SendNoteRequest {
  @IsIn(['apns', 'firebase'])
  tokenType: 'apns' | 'firebase';

  @IsDeviceToken()
  deviceToken: string;
}
```

#### Extended DTOs using PartialType:
- `SendGenericWelcomeNoteRequest` - For welcome notifications
- `SendGenericActivityReminderRequest` - Adds activity name/ID fields
- `SendGenericNewMessageNoteRequest` - Adds sender name field

### 4. Error Handling

The existing `SentryExceptionFilter` handles validation errors appropriately:
- **Client errors (4xx)**: Not reported to Sentry (expected behavior)
- **Server errors (5xx)**: Reported to Sentry for monitoring
- **Validation errors**: Return structured error responses with field-specific messages

## Validation Flow

```
1. HTTP Request → 2. Global ValidationPipe → 3. DTO Decorators → 4. Custom Validators
                                                                           ↓
6. Controller ← 5. Transformed DTO Instance ← 4b. Validation Success
                                                                           ↓
6b. Error Response ← 5b. SentryExceptionFilter ← 4c. Validation Failure
```

### Step-by-Step Process:

1. **Request Received**: HTTP request with JSON payload
2. **Global Validation**: ValidationPipe processes request against DTO
3. **Decorator Validation**: Built-in decorators (@IsString, @MaxLength, etc.) validate
4. **Custom Validation**: Custom decorators (@IsDeviceToken) validate device tokens
5. **Success Path**: Request is transformed to DTO instance and passed to controller
6. **Error Path**: Validation failures are caught by SentryExceptionFilter and formatted

## Best Practices

### 1. DTO Design
```typescript
// ✅ Good: Use specific validation decorators
@IsString()
@MaxLength(100)
@IsOptional()
activityName?: string;

// ❌ Bad: Generic validation without constraints
@IsString()
data: any;
```

### 2. Error Messages
```typescript
// ✅ Good: Descriptive error messages
@IsIn(['apns', 'firebase'], {
  message: 'tokenType must be either "apns" for Apple Push Notifications or "firebase" for Firebase Cloud Messaging'
})

// ❌ Bad: Generic error messages
@IsIn(['apns', 'firebase'])
```

### 3. Security Considerations
- Always use `whitelist: true` to strip unknown properties
- Use `forbidNonWhitelisted: true` in sensitive endpoints
- Validate input lengths to prevent DoS attacks
- Use specific types instead of `any`

### 4. Performance Tips
- Use `@IsOptional()` for optional fields to skip validation when not present
- Combine validators efficiently (e.g., `@IsString() @MaxLength(100)`)
- Use `PartialType()` for flexible DTOs that extend base requirements

## Testing Validation

### Unit Tests for Custom Validators
```typescript
// Test APNs device token validation
const validApnsToken = "a1b2c3d4e5f61234567890abcdef1234567890abcdef1234567890abcdef1234";
const invalidApnsToken = "not-a-hex-string";

// Test Firebase device token validation  
const validFirebaseToken = "eEAR1YiGTkS_long_base64url_encoded_token_here...";
const invalidFirebaseToken = "too-short";
```

### Integration Tests
```typescript
// Test complete validation flow
POST /notifications/activity-reminder
{
  "tokenType": "apns",
  "deviceToken": "invalid-token",
  "activityName": "a".repeat(200) // Too long
}

// Expected: 400 Bad Request with detailed validation errors
```

## Common Validation Patterns

### 1. Optional Fields with Validation
```typescript
@IsOptional()
@IsString()
@MaxLength(100)
optionalField?: string;
```

### 2. Conditional Validation
```typescript
@IsDeviceToken() // Validates based on tokenType field
deviceToken: string;

@IsIn(['apns', 'firebase'])
tokenType: 'apns' | 'firebase';
```

### 3. Array Validation
```typescript
@IsArray()
@ArrayMinSize(1)
@ArrayMaxSize(10)
@IsString({ each: true })
tags: string[];
```

## Monitoring and Debugging

### Error Response Format
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/notifications/send",
  "message": [
    "deviceToken must be a valid APNs device token (hexadecimal string, 8-512 characters)",
    "activityName must not exceed 100 characters"
  ]
}
```

### Sentry Integration
- Validation errors (4xx) are NOT sent to Sentry
- Server errors (5xx) are automatically captured
- Request context is included in error reports

## References

- [NestJS Validation Documentation](https://docs.nestjs.com/techniques/validation)
- [class-validator GitHub](https://github.com/typestack/class-validator)
- [Apple APNs Documentation](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)