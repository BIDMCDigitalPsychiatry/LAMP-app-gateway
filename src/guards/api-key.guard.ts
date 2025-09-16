import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {

  private readonly validApiKeys : string[]
  private readonly authExemptPaths : string[]

  constructor(
    private configService: ConfigService
  ) {
    this.authExemptPaths = configService.getOrThrow("app.auth.publicPaths")
    this.validApiKeys = configService.getOrThrow("app.auth.bearer.keyWhitelist")
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (this.isWhitelistedPath(request.path)) {
      return true
    }

    if (this.hasValidApiKey(request)) {
      return true
    }

    return false;
  }

  isWhitelistedPath(path: string) {
    return this.authExemptPaths.includes(path)
  }
  
  hasValidApiKey(req: Request) {
    const token = req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.slice(7) 
      : null;
    
    return !!(token && this.validApiKeys.includes(token))
  }

}

