import { UUID } from "node:crypto"
import { ActivityReminderNoteParams } from "./messages/activity-reminder-note.dto"
import { MessageReceivedNoteParams } from "./messages/message-received-note.dto"
import { WelcomeNoteParams } from "./messages/welcome-note.dto"
import { ApnsPriority } from "./providers/apple-push-notification.service"
import { OneTimePasswordNoteParams } from "./messages/one-time-password-note.dto"

export type ServiceKey = "apns" | "firebase" | "email" | "sms"
interface NotificationDestinationBase {
  service: ServiceKey
}

type ApnsToken = string
type FirebaseToken = string
type PhoneNumber = string
type Email = string

export interface ApnsDestination extends NotificationDestinationBase {
  service: "apns",
  token: ApnsToken
}

export interface FirebaseDestination extends NotificationDestinationBase {
  service: "firebase",
  token: FirebaseToken
}

export interface SmsDestination extends NotificationDestinationBase {
  service: "sms",
  phoneNumber: PhoneNumber
}

export interface EmailDestination extends NotificationDestinationBase {
  service: "email",
  email: Email
}

export type NotificationDestination =
  ApnsDestination |
  FirebaseDestination |
  SmsDestination |
  EmailDestination

export interface Message {
  readonly id: UUID;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly apnsExpiry: number;
  readonly apnsPriority: ApnsPriority;
}

export interface IMessagingService {
  sendMessage(dest: NotificationDestination, message: Message): Promise<MessageDispatchResult>
}

export interface IDispatcherService {
  sendDemoNote(dest: NotificationDestination): Promise<void>
  sendWelcomeNote(dest: NotificationDestination, params: WelcomeNoteParams): Promise<void>
  sendActivityReminderNote(dest: NotificationDestination, params: ActivityReminderNoteParams): Promise<void>
  sendMessageReceivedNote(dest: NotificationDestination, params: MessageReceivedNoteParams): Promise<void>
  sendOneTimePasswordNote(dest: NotificationDestination, params: OneTimePasswordNoteParams): Promise<void>
}

export interface MessageDispatchResult {
  messageId: string;
  vendorMessageId: string | undefined;
  successful: boolean
}