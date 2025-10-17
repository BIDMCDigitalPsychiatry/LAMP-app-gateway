import { Inject, Injectable } from '@nestjs/common';
import { IMessagingService, Message, MessageDispatchResult, NotificationDestination, SmsDestination } from '../domain';

import awsSmsConfig from '../config/aws-sms.config';
import { PinpointSMSVoiceV2Client, PinpointSMSVoiceV2ClientConfig, SendTextMessageCommand, SendTextMessageRequest } from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { invariant } from '../../../utils/invariant';

export interface AwsEndUserMessagingConfig {
  configSetName: string,
  originationIdentity: string // Id of Pool
}


@Injectable()
export class AwsEndUserMessagingService implements IMessagingService {

  private readonly client: PinpointSMSVoiceV2Client;
  private readonly awsOriginationIdentity: string;
  private readonly awsConfigSetName: string;

  constructor(
    @Inject(awsSmsConfig.KEY)
    private config: AwsEndUserMessagingConfig
  ) {
    this.awsConfigSetName = config.configSetName;
    this.awsOriginationIdentity = config.originationIdentity;

    const clientConfig : PinpointSMSVoiceV2ClientConfig = {}
    this.client = new PinpointSMSVoiceV2Client(clientConfig)
  }


  async sendMessage(dest: NotificationDestination, message: Message): Promise<MessageDispatchResult> {
    invariant(dest.service === "sms", `Message intended for '${dest.service}' delivery, not AWS End User Messaging ('sms')`)
    const { service, phoneNumber } = dest as SmsDestination
    
    const input : SendTextMessageRequest = {
      // Static Config
      ConfigurationSetName: this.awsConfigSetName,
      OriginationIdentity: this.awsOriginationIdentity,
      MessageType: "TRANSACTIONAL",
      // TimeToLive: // TODO (need to update apnsExpiry to expiry -- maybe add function for calculating number of seconds from now)

      // Per Message Config
      DestinationPhoneNumber: phoneNumber,
      MessageBody: (message.title === "") ? message.body : `${message.title}\n${message.body}`
    }

    const command = new SendTextMessageCommand(input)

    const output = await this.client.send(command)

    return {
      messageId: message.id,
      vendorMessageId: output.MessageId,
      successful: true
    }
  }
}
