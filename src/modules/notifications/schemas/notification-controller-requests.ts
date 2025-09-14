import z from 'zod';
import { createZodDto } from 'nestjs-zod';

import { notificationDestinationSchema } from "./shared";

const sendWelcomeNotePayloadSchema = z.object({
  destination: notificationDestinationSchema,
  options: z.object().optional()
});

const sendActivityReminderNotePayloadSchema = z.object({
  destination: notificationDestinationSchema,
  options: z.object().optional()
});

const sendMessageReceivedNotePayloadSchema = z.object({
  destination: notificationDestinationSchema,
  options: z.object().optional()
});

// Create DTO classes for NestJS validation
export class SendWelcomeNotePayload extends createZodDto(sendWelcomeNotePayloadSchema) {}
export class SendActivityReminderNotePayload extends createZodDto(sendActivityReminderNotePayloadSchema) {}
export class SendMessageReceivedNotePayload extends createZodDto(sendMessageReceivedNotePayloadSchema) {}

// Export schemas for testing and other uses
export const sendWelcomeNotePayload = sendWelcomeNotePayloadSchema;
export const sendActivityReminderNotePayload = sendActivityReminderNotePayloadSchema;
export const sendMessageReceivedNotePayload = sendMessageReceivedNotePayloadSchema;