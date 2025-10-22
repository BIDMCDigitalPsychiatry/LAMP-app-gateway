import { Inject, Injectable, Logger } from '@nestjs/common';

import awsSmsConfig from '../config/aws-sms.config';
import { PinpointSMSVoiceV2Client, PinpointSMSVoiceV2ClientConfig, SendTextMessageCommand, SendTextMessageRequest } from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { Message, MessageDispatchResult, PhoneNumber } from '../domain';

export interface AwsEndUserMessagingConfig {
  configSetName: string,
  originationIdentity: string, // Id of Pool
  region: string
}

export const SIMULATOR_PHONE_NUMBERS = {
  US: {
    SUCCESS: "+14254147755",
    FAIL: "+14254147167"
  }
}

@Injectable()
export class AwsEndUserMessagingService {

  private readonly client: PinpointSMSVoiceV2Client;
  private readonly awsOriginationIdentity: string;
  private readonly awsConfigSetName: string;

  private readonly logger = new Logger(AwsEndUserMessagingService.name);

  constructor(
    @Inject(awsSmsConfig.KEY)
    private config: AwsEndUserMessagingConfig
  ) {
    this.awsConfigSetName = config.configSetName;
    this.awsOriginationIdentity = config.originationIdentity;

    const clientConfig : PinpointSMSVoiceV2ClientConfig = {
      region: config.region
    }
    this.client = new PinpointSMSVoiceV2Client(clientConfig)
  }


  async sendMessage(phoneNumber: PhoneNumber, message: Message): Promise<MessageDispatchResult> {
    this.logger.log(`Sending ${message.type}(${message.id}) via AWS End User Messaging`)

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
    this.logger.log(`Successfully sent ${message.type}(${message.id}). MessageId: '${output.MessageId}'`)

    return {
      messageId: message.id,
      vendorMessageId: output.MessageId,
      successful: true
    }
  }

}
