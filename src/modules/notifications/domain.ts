import { ActivityReminderNoteParams } from "./messages/activity-reminder-note.dto"
import { MessageReceivedNoteParams } from "./messages/message-received-note.dto"
import { WelcomeNoteParams } from "./messages/welcome-note.dto"

export type ServiceKey = "apns" | "firebase"
interface NotificationDestinationBase {
  service: ServiceKey
}

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
  readonly title: string;
  readonly body: string;
}

export interface IMessagingService {
  sendMessage(dest: NotificationDestination, message: Message): Promise<void>
}

export interface IDispatcherService {
  sendDemoNote(dest: NotificationDestination): Promise<void>
  sendWelcomeNote(dest: NotificationDestination, params: WelcomeNoteParams): Promise<void>
  sendActivityReminderNote(dest: NotificationDestination, params: ActivityReminderNoteParams): Promise<void>
  sendMessageReceivedNote(dest: NotificationDestination, params: MessageReceivedNoteParams): Promise<void>
}