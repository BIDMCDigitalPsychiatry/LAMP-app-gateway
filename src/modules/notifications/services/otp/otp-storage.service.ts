import { DeleteItemCommand, DeleteItemInput, DynamoDBClient, GetItemCommand, GetItemCommandOutput, GetItemInput, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { Inject, Injectable } from '@nestjs/common';

import dynamoOtpConfig from '../../config/dynamo-otp.config';
import { Maybe, OneTimePasswordIdentifier, UnixEpochSeconds } from '../../domain';
import { not, path } from 'ramda';
import { invariant } from '../../../../utils/invariant';

export interface DynamoOtpRepositoryConfig {
  region: string,
  table: string,
}

function isExpired(exp: UnixEpochSeconds) {
  const now = Date.now() / 1000
  return exp < now
}

@Injectable()
export class OtpStorageService {

  private readonly client: DynamoDBClient;
  private readonly tableName: string;

  constructor(
    @Inject(dynamoOtpConfig.KEY)
    private config: DynamoOtpRepositoryConfig
  ){
    this.client = new DynamoDBClient({ region: config.region })
    this.tableName = config.table
  }

  public async removeAllFor(identifier: OneTimePasswordIdentifier) {
    const input : DeleteItemInput = {
      TableName: this.tableName,
      Key: {
        Identifier: { S: identifier }
      }
    }
    await this.client.send(new DeleteItemCommand(input))
  }

  public async fetch(identifier: OneTimePasswordIdentifier): Promise<Maybe<string>> {
    const input : GetItemInput = {
      TableName: this.tableName,
      Key: {
        Identifier: {
          S: identifier
        }
      }
    }

    const output : GetItemCommandOutput = await this.client.send(new GetItemCommand(input))

    const item = output.Item
    const hash = path(["Item", "Hash",      "S"], output)
    const expStr  = path(["Item", "ExpiresAt", "N"], output)

    if (item && hash && expStr) {
      invariant(typeof expStr === 'string', `Expected the expiration of the OTP code to be a number. Instead it is "${typeof expStr}"`)
      invariant(typeof hash === 'string', `Expected the hash of the OTP code to be a string. Instead it is "${typeof hash}"`)

      const exp = parseInt(expStr)

      if (not(isExpired(exp))) {
        return hash
      }
    }

    return
  }

  public async save(identifier: OneTimePasswordIdentifier, hash: string, exp: UnixEpochSeconds) : Promise<void> {
    const expiresAt : UnixEpochSeconds = Math.floor((Date.now() + 15 * 60 * 1000) / 1000); // 15 min from now

    const input : PutItemCommandInput = {
      TableName: this.tableName,
      Item: {
        Identifier: {
          S: identifier
        },
        Hash: {
          S: hash
        },
        ExpiresAt: {
          N: expiresAt.toString()
        }
      }
    }
    await this.client.send(new PutItemCommand(input));
  }
}
