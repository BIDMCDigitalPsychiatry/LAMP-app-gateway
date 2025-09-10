import { PartialType } from '@nestjs/mapped-types';
import { SendNoteRequest } from './send-note-request.dto';

/**
 * DTO for sending generic welcome push notifications
 * 
 * This DTO extends the base SendNoteRequest using PartialType, making all
 * inherited fields optional while maintaining their validation rules when present.
 * 
 * Usage Example:
 * ```typescript
 * POST /notifications/welcome
 * {
 *   "tokenType": "firebase",
 *   "deviceToken": "eEAR1YiGTkS_example_firebase_token_here..."
 * }
 * ```
 * 
 * Validation:
 * - All fields from SendNoteRequest are optional
 * - When tokenType is provided, it must be 'apns' or 'firebase'
 * - When deviceToken is provided, it must match the tokenType format
 * - If one field is provided, both should typically be provided for functionality
 */
export class SendGenericWelcomeNoteRequest extends PartialType(SendNoteRequest) {
  // No additional properties - this DTO is purely for type safety and API clarity
  // The welcome message content will be predefined by the service layer
}