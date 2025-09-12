/**
 * Notification DTOs Export Index
 * 
 * This file provides a centralized export point for all notification-related DTOs.
 * It follows NestJS best practices for organizing DTOs and makes importing cleaner.
 * 
 * Usage:
 * ```typescript
 * import { SendGenericWelcomeNoteRequest, SendGenericActivityReminderRequest } from './dto';
 * ```
 * 
 * DTO Hierarchy:
 * - SendNoteRequest: Base DTO with device token and token type validation
 * - SendGenericWelcomeNoteRequest: Extends PartialType(SendNoteRequest) for welcome notifications
 * - SendGenericActivityReminderRequest: Adds activity-specific fields for reminders
 * - SendGenericNewMessageNoteRequest: Adds sender information for message notifications
 */

export { SendNoteRequest } from './send-note-request.dto';
export { SendGenericWelcomeNoteRequest } from './send-generic-welcome-note-request.dto';
export { SendGenericActivityReminderRequest } from './send-generic-activity-reminder-request.dto';
export { SendGenericNewMessageNoteRequest } from './send-generic-new-message-note-request.dto';