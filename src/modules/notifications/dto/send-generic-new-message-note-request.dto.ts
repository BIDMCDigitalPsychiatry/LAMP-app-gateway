
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { SendNoteRequest } from './send-note-request.dto';
import { PartialType } from '@nestjs/mapped-types';

/**
 * DTO for sending generic new message push notifications
 * 
 * This DTO extends SendNoteRequest with optional sender information.
 * Used for notifying users about new messages, chats, or communications.
 * 
 * Usage Example:
 * ```typescript
 * POST /notifications/new-message
 * {
 *   "tokenType": "firebase",
 *   "deviceToken": "eEAR1YiGTkS_example_firebase_token_here...",
 *   "senderName": "Dr. Smith"
 * }
 * ```
 * 
 * Validation Rules:
 * - Inherits tokenType and deviceToken validation from SendNoteRequest (all optional via PartialType)
 * - senderName: Optional string, max 100 characters for display compatibility
 * 
 * Use Cases:
 * - New chat messages from healthcare providers
 * - System notifications about updates
 * - Peer-to-peer messaging in group activities
 */
export class SendGenericNewMessageNoteRequest extends PartialType(SendNoteRequest) {
  /**
   * Name of the person or system sending the message
   * Used in push notification content to provide context
   * 
   * Examples: "Dr. Smith", "Care Team", "System Administrator", "John Doe"
   */
  @IsOptional()
  @IsString({
    message: 'senderName must be a string'
  })
  @MaxLength(100, {
    message: 'senderName must not exceed 100 characters'
  })
  senderName?: string;
}