import { Inject, Injectable } from '@nestjs/common';
import { IMessagingService, Message, MessageDispatchResult, NotificationDestination } from '../domain';

import awsSesConfig from '../config/aws-ses.config';

export interface AwsSesConfig {
}



@Injectable()
export class AwsSesService implements IMessagingService {

  // private readonly awsClient: ??? ;

  constructor(
    @Inject(awsSesConfig.KEY)
    private config: AwsSesConfig
  ) {
    // this.awsClient = 

  }

  sendMessage(dest: NotificationDestination, message: Message): Promise<MessageDispatchResult> {
    throw new Error('Method not implemented.');
  }
}
