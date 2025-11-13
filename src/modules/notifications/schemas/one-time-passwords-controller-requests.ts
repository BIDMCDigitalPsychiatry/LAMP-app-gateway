import z from 'zod';
import { createZodDto } from 'nestjs-zod';

export const sendOtpViaEmailPayloadSchema = z.object({
  email: z.email()
})
export const sendOtpViaTextMessagePayloadSchema = z.object({
  phoneNumber: z.e164()
})
export const verifyOtpPayloadSchema = z.object({
  identifier: z.union([
    z.e164(),
    z.email(),
  ]),
  code: z.string().length(6).regex(/^[0-9]+/)
})

// Create DTO classes for NestJS validation
export class SendOtpViaEmailPayload extends createZodDto(sendOtpViaEmailPayloadSchema) {}
export class SendOtpViaTextMessagePayload extends createZodDto(sendOtpViaTextMessagePayloadSchema) {}
export class VerifyOtpPayload extends createZodDto(verifyOtpPayloadSchema) {}
