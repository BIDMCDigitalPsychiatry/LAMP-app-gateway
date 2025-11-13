import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import * as argon2 from "argon2";

export interface OneTimePasswordPacket {
  exp: number,
  code: OneTimePassword,
  hash: string
}

export type OneTimePassword = string

@Injectable()
export class OtpService {

  public async generateOneTimePassword() : Promise<OneTimePasswordPacket> {
    const code = randomInt(0, 1000000).toString().padStart(6, "0")
    const exp = Date.now() + 15 * 60 * 1000 // Epoch milliseconds
    const hash = await argon2.hash(code)
  
    return {
      code, // Send to user
      exp,  // Store in database
      hash  // Store in database
    }
  }

  public async verifyOneTimePassword(candidate: OneTimePassword, hash: string) : Promise<boolean> {
    try {
      return await argon2.verify(hash, candidate)
    } catch (err) {
      return false
    }
  }

}
