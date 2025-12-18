import { Body, Controller, Post } from '@nestjs/common';
import { DispatcherService } from '../../dispatcher.service';
import { SendActivityReminderNotePayload, SendMessageReceivedNotePayload, SendWelcomeNotePayload } from '../../schemas/notification-controller-requests';

@Controller('v1/generic')
export class GenericPushNotificationsController {

  constructor(
    private readonly dispatcher: DispatcherService,
  ) {
    this.dispatcher = dispatcher;
  }

  @Post('/welcome')
  async sendWelcomeNote(@Body() payload: SendWelcomeNotePayload): Promise<string> {
    await this.dispatcher.sendWelcomeNote(payload.destination, payload.options || {})
    return "ok"
  }


  @Post('/activity-reminder')
  async sendActivityReminderNote(@Body() payload: SendActivityReminderNotePayload): Promise<string> {
    await this.dispatcher.sendActivityReminderNote(payload.destination, payload.options || {})
    return "ok"
  }


  @Post('/new-message')
  async sendMessageReceivedNote(@Body() payload: SendMessageReceivedNotePayload): Promise<string> {
    await this.dispatcher.sendMessageReceivedNote(payload.destination, payload.options || {})
    return "ok"
  }

}
