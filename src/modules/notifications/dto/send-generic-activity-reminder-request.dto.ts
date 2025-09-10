
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { SendNoteRequest } from './send-note-request.dto';
import { PartialType } from '@nestjs/mapped-types';

/**
 * DTO for sending generic activity reminder push notifications
 * 
 * This DTO extends SendNoteRequest with optional activity-specific fields.
 * Used for reminding users about specific activities or tasks.
 * 
 * Usage Example:
 * ```typescript
 * POST /notifications/activity-reminder
 * {
 *   "tokenType": "apns",
 *   "deviceToken": "a1b2c3d4e5f6...",
 *   "activityName": "Morning Meditation",
 *   "activityId": "meditation_001"
 * }
 * ```
 * 
 * Validation Rules:
 * - Inherits tokenType and deviceToken validation from SendNoteRequest (all optional via PartialType)
 * - activityName: Optional string, max 100 characters for display compatibility
 * - activityId: Optional string, max 50 characters for system/database compatibility
 */
export class SendGenericActivityReminderRequest extends PartialType(SendNoteRequest) {
  /**
   * Human-readable name of the activity to remind about
   * Used in push notification content and UI display
   * 
   * Examples: "Morning Meditation", "Daily Survey", "Exercise Session"
   */
  @IsOptional()
  @IsString({
    message: 'activityName must be a string'
  })
  @MaxLength(100, {
    message: 'activityName must not exceed 100 characters'
  })
  activityName?: string;

  /**
   * System identifier for the specific activity
   * Used for tracking, analytics, and deep linking
   * 
   * Examples: "meditation_001", "survey_daily", "exercise_cardio_beginner"
   */
  @IsOptional()
  @IsString({
    message: 'activityId must be a string'
  })
  @MaxLength(50, {
    message: 'activityId must not exceed 50 characters'
  })
  activityId?: string;
}