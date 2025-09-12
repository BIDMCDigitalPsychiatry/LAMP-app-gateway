import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validates Apple Push Notification Service (APNs) device tokens
 * 
 * APNs device tokens are hexadecimal strings that uniquely identify
 * an app installation on a specific device for push notifications.
 * 
 * Format: Hexadecimal characters (0-9, a-f, A-F)
 * Length: Variable - Apple states "Don't make assumptions about the device token length"
 * 
 * Reference: Apple Developer Documentation
 * https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
 * 
 * From Apple's documentation:
 * "The device token is a unique identifier assigned by APNs to a specific app on a specific device.
 * Only APNs can decode and read a device token. Each app instance receives its unique token
 * when it registers with APNs. The app must pass this token to the provider so that the
 * provider can send notifications to the device."
 * 
 * Best Practices (from Apple's documentation):
 * - Don't make assumptions about the device token length
 * - Treat device tokens as opaque data
 * - Device tokens can change, so always use the most recent token
 */
export function IsApnsDeviceToken(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isApnsDeviceToken',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          
          // APNs device tokens are hexadecimal strings of variable length
          // We validate format (hex characters only) but not length per Apple's best practices
          const apnsTokenRegex = /^[0-9a-fA-F]+$/;
          
          // Ensure minimum reasonable length (at least 8 characters)
          // and maximum reasonable length to prevent abuse (512 characters)
          return apnsTokenRegex.test(value) && value.length >= 8 && value.length <= 512;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid APNs device token (hexadecimal string, 8-512 characters)`;
        },
      },
    });
  };
}

/**
 * Validates Firebase Cloud Messaging (FCM) registration tokens
 * 
 * FCM registration tokens are base64url-encoded strings that uniquely identify
 * an app installation for push notifications via Firebase.
 * 
 * Format: Base64url-encoded string, typically 140+ characters
 * Contains: Letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_)
 * Example: "eEAR1YiGTkS_example_token_string_here_with_various_characters-_"
 * 
 * Reference: Firebase Cloud Messaging Documentation
 * https://firebase.google.com/docs/cloud-messaging/android/client#retrieve-the-current-registration-token
 * https://firebase.google.com/docs/cloud-messaging/ios/client#access_the_registration_token
 * 
 * From Firebase documentation:
 * "On initial startup of your app, the FCM SDK generates a registration token
 * for the client app instance. This token identifies the app installation uniquely."
 * 
 * Token characteristics:
 * - Base64url encoded (RFC 4648 Section 5)
 * - Variable length, typically 140+ characters
 * - Contains alphanumeric characters, hyphens, and underscores
 * - No padding characters (=) due to base64url encoding
 */
export function IsFirebaseDeviceToken(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFirebaseDeviceToken',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          
          // Firebase tokens are base64url encoded strings
          // Base64url uses: A-Z, a-z, 0-9, -, _ (no padding)
          // Minimum realistic length is around 140 characters
          const firebaseTokenRegex = /^[A-Za-z0-9_-]{140,}$/;
          return firebaseTokenRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Firebase device token (base64url-encoded string, 140+ characters)`;
        },
      },
    });
  };
}

/**
 * Validates device tokens based on the specified token type
 * 
 * This decorator dynamically validates device tokens using the appropriate
 * validation logic based on a companion 'tokenType' field in the same DTO.
 * 
 * Usage:
 * ```typescript
 * export class SendNotificationDto {
 *   @IsIn(['apns', 'firebase'])
 *   tokenType: 'apns' | 'firebase';
 * 
 *   @IsDeviceToken()
 *   deviceToken: string;
 * }
 * ```
 */
export function IsDeviceToken(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDeviceToken',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const tokenType = obj.tokenType;
          
          if (!tokenType) {
            return false;
          }
          
          if (typeof value !== 'string') {
            return false;
          }
          
          switch (tokenType) {
            case 'apns':
              // APNs device tokens: hexadecimal characters, variable length (following Apple's best practices)
              return /^[0-9a-fA-F]+$/.test(value) && value.length >= 8 && value.length <= 512;
            case 'firebase':
              // Firebase tokens: base64url encoded, 140+ characters
              return /^[A-Za-z0-9_-]{140,}$/.test(value);
            default:
              return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as any;
          const tokenType = obj.tokenType;
          
          if (!tokenType) {
            return `${args.property} validation requires a valid tokenType field`;
          }
          
          switch (tokenType) {
            case 'apns':
              return `${args.property} must be a valid APNs device token (hexadecimal string, 8-512 characters)`;
            case 'firebase':
              return `${args.property} must be a valid Firebase device token (base64url-encoded string, 140+ characters)`;
            default:
              return `${args.property} validation failed: unsupported tokenType '${tokenType}'`;
          }
        },
      },
    });
  };
}