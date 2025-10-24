import { SendTemplatedEmailCommand, SendTemplatedEmailCommandInput, SESClient, SESClientConfig } from "@aws-sdk/client-ses";
import { Inject, Injectable, Logger } from '@nestjs/common';
import awsSesConfig from '../config/aws-ses.config';
import { Email, JSONValue, Message, MessageDispatchResult } from "../domain";
import { invariant } from "../../../utils/invariant";

export interface AwsEmailServiceConfig {
  region: string,
  senderEmailAddress: Email,
  replyToAddress: Email,
  templateSuffix: string,
}

function isEmailable(message: Message) : boolean {
  return (!! message.opts.ses)
}

export interface SesOptions {
  templateName: string,
  templateData: { [key: string]: JSONValue }
}

@Injectable()
export class AwsEmailService {

    private readonly client: SESClient;
    private readonly senderEmailAddress: Email;
    private readonly replyToAddress: Email;
    private readonly templateSuffix: string;
  
    private readonly logger = new Logger(AwsEmailService.name);
  
    constructor(
      @Inject(awsSesConfig.KEY)
      private config: AwsEmailServiceConfig
    ) {
  
      const clientConfig : SESClientConfig = {
        region: config.region
      }
      this.client = new SESClient(clientConfig)
      this.senderEmailAddress = config.senderEmailAddress
      this.replyToAddress = config.replyToAddress
      this.templateSuffix = config.templateSuffix
    }
  
  
    async sendMessage(email: Email, message: Message): Promise<MessageDispatchResult> {
      invariant(isEmailable(message), `Message settings do not permit sending via Email. Configure ses options.`)
      
      this.logger.log(`Sending ${message.type}(${message.id}) via AWS Simple Email Service (SES)`)
  
      const input : SendTemplatedEmailCommandInput = {
        // Static Config
        Source: this.senderEmailAddress,
        ReplyToAddresses: [this.replyToAddress],
  
        // Per Message Config
        Destination: {
          ToAddresses: [email]
        },
        Template: `${message.opts.ses!.templateName}${this.templateSuffix}`,
        TemplateData: JSON.stringify(message.opts.ses!.templateData)
      }
  
      const command = new SendTemplatedEmailCommand(input)
  
      const output = await this.client.send(command)
      this.logger.log(`Successfully sent ${message.type}(${message.id}). MessageId: '${output.MessageId}'`)
  
      return {
        messageId: message.id,
        vendorMessageId: output.MessageId,
        successful: true
      }
    }



}
