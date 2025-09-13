import z from 'zod';

import { notificationDestinationSchema } from "./shared";

const sendWelcomeNotePayload = z
  .object({
    destination: notificationDestinationSchema,
    options: z.object().optional()
  })
  .required();

const sendActivityReminderNotePayload = z
  .object({
    destination: notificationDestinationSchema,
    options: z.object().optional()
  })
  .required();

const sendMessageReceivedNotePayload = z
  .object({
    destination: notificationDestinationSchema,
    options: z.object().optional()
  })
  .required();

export type SendWelcomeNotePayload = z.infer<typeof sendWelcomeNotePayload>;
export type SendActivityReminderNotePayload = z.infer<typeof sendActivityReminderNotePayload>;
export type SendMessageReceivedNotePayload = z.infer<typeof sendMessageReceivedNotePayload>;