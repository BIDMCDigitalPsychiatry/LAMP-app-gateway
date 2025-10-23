import { Injectable } from '@nestjs/common';
import { FirebaseMessagingService } from './providers/firebase-messaging.service';
import { ApplePushNotificationService } from './providers/apple-push-notification.service';
import { IDispatcherService, IMessagingService, NotificationDestination, ServiceKey } from './domain';
import { WelcomeNote, WelcomeNoteParams } from './messages/welcome-note.dto';
import { ActivityReminderNote, ActivityReminderNoteParams } from './messages/activity-reminder-note.dto';
import { MessageReceivedNote, MessageReceivedNoteParams } from './messages/message-received-note.dto';
import { DemoNote } from './messages/demo-note.dto';

@Injectable()
export class DispatcherService implements IDispatcherService {

  private readonly destinations : Record<ServiceKey, IMessagingService>

  constructor(
    private readonly firebaseService: FirebaseMessagingService,
    private readonly apnsService: ApplePushNotificationService,
  ) {
    this.destinations = {
      "apns": apnsService,
      "firebase": firebaseService,
    }
  }

  async sendDemoNote(dest: NotificationDestination): Promise<void> {
    const msg = new DemoNote()
    await this.destinations[dest.service].sendMessage(dest, msg)
    return
  }

  async sendWelcomeNote(dest: NotificationDestination, params: WelcomeNoteParams): Promise<void> {
    const msg = new WelcomeNote(params)
    await this.destinations[dest.service].sendMessage(dest, msg)
    return
  }

  async sendActivityReminderNote(dest: NotificationDestination, params: ActivityReminderNoteParams): Promise<void> {
    const msg = new ActivityReminderNote(params)
    await this.destinations[dest.service].sendMessage(dest, msg)
    return
  }
  async sendMessageReceivedNote(dest: NotificationDestination, params: MessageReceivedNoteParams): Promise<void> {
    const msg = new MessageReceivedNote(params)
    await this.destinations[dest.service].sendMessage(dest, msg)
    return
  }
}
