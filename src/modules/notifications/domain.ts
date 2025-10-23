import { UUID } from "node:crypto"
import { ActivityReminderNoteParams } from "./messages/activity-reminder-note.dto"
import { MessageReceivedNoteParams } from "./messages/message-received-note.dto"
import { WelcomeNoteParams } from "./messages/welcome-note.dto"
import { ApnsOptions } from "./providers/apple-push-notification.service"

export type ServiceKey = "apns" | "firebase"
interface NotificationDestinationBase {
  service: ServiceKey
}

export type PhoneNumber = string
export type Email = string
type ApnsToken = string
type FirebaseToken = string

export interface ApnsDestination extends NotificationDestinationBase {
  service: "apns",
  token: ApnsToken
}

export interface FirebaseDestination extends NotificationDestinationBase {
  service: "firebase",
  token: FirebaseToken
}

export type NotificationDestination =
  ApnsDestination |
  FirebaseDestination

export interface Message {
  readonly id: UUID;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly expiresAt: number; // Unix Timestamp (seconds since midnight 1/1/1970, utc)
  readonly opts: MessageOptions
}

export interface MessageOptions {
  apns?: ApnsOptions,
}

export interface IMessagingService {
  sendMessage(dest: NotificationDestination, message: Message): Promise<MessageDispatchResult>
}

export interface IDispatcherService {
  sendDemoNote(dest: NotificationDestination): Promise<void>
  sendWelcomeNote(dest: NotificationDestination, params: WelcomeNoteParams): Promise<void>
  sendActivityReminderNote(dest: NotificationDestination, params: ActivityReminderNoteParams): Promise<void>
  sendMessageReceivedNote(dest: NotificationDestination, params: MessageReceivedNoteParams): Promise<void>
}

export interface MessageDispatchResult {
  messageId: string;
  vendorMessageId: string | undefined;
  successful: boolean
}