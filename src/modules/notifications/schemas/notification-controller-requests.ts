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

const sendOneTimePasswordNotePayloadSchema = z.object({
  destination: notificationDestinationSchema,
  options: z.object({
    code: z.string().min(6).max(10).regex(/^[0-9]+$/)
  }).required()
});

// Create DTO classes for NestJS validation
export class SendWelcomeNotePayload extends createZodDto(sendWelcomeNotePayloadSchema) {}
export class SendActivityReminderNotePayload extends createZodDto(sendActivityReminderNotePayloadSchema) {}
export class SendMessageReceivedNotePayload extends createZodDto(sendMessageReceivedNotePayloadSchema) {}
export class SendOneTimePasswordNotePayload extends createZodDto(sendOneTimePasswordNotePayloadSchema) {}

// Export schemas for testing and other uses
export const sendWelcomeNotePayload = sendWelcomeNotePayloadSchema;
export const sendActivityReminderNotePayload = sendActivityReminderNotePayloadSchema;
export const sendMessageReceivedNotePayload = sendMessageReceivedNotePayloadSchema;
export const sendOneTimePasswordNotePayload = sendOneTimePasswordNotePayloadSchema;