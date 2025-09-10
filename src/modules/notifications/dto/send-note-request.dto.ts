import { IsString, IsIn } from 'class-validator';
import { IsDeviceToken } from '../../../common/validation/decorators/device-token.decorator';

/**
 * Base DTO for sending push notifications
 * 
 * This DTO defines the core requirements for sending push notifications:
 * - Device token (either APNs or Firebase format)
 * - Token type specification for proper validation
 * 
 * Validation Flow:
 * 1. tokenType must be either 'apns' or 'firebase'
 * 2. deviceToken format is validated based on tokenType using custom decorator
 * 3. APNs tokens: hexadecimal strings (variable length per Apple's best practices)
 * 4. Firebase tokens: base64url-encoded strings (typically 140+ characters)
 */
export class SendNoteRequest {
  /**
   * The push notification service type
   * Determines how the deviceToken will be validated
   */
  @IsString()
  @IsIn(['apns', 'firebase'], {
    message: 'tokenType must be either "apns" for Apple Push Notifications or "firebase" for Firebase Cloud Messaging'
  })
  tokenType!: 'apns' | 'firebase';

  /**
   * Device-specific push notification token
   * Format is validated based on tokenType:
   * - APNs: Hexadecimal string (variable length)
   * - Firebase: Base64url-encoded string
   */
  @IsString()
  @IsDeviceToken({
    message: 'deviceToken format must match the specified tokenType'
  })
  deviceToken!: string;
}