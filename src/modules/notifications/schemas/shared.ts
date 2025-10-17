import z from 'zod';

export const apnsTokenSchema = z.string()
export const firebaseTokenSchema = z.string()

export const notificationDestinationSchema = z.discriminatedUnion("service", [
  z.object({ service: z.literal("apns"), token: apnsTokenSchema }),
  z.object({ service: z.literal("firebase"), token: firebaseTokenSchema }),
  z.object({ service: z.literal("sms"), phoneNumber: z.e164() }), // TODO: Make sure this aligns with end-user-messaging required format
  z.object({ service: z.literal("email"), email: z.email() }),
])
