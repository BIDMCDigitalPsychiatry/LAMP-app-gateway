import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class EnvRequirementGuard implements CanActivate {

  private readonly requiredEnvVars: string[];

  constructor(envVars: string | string[]) {
    // Normalize to array for consistent processing
    this.requiredEnvVars = Array.isArray(envVars) ? envVars : [envVars];
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.areAllEnvVarsSet();
  }

  private areAllEnvVarsSet(): boolean {
    return this.requiredEnvVars.every(envVar => this.isEnvVarSet(envVar));
  }

  private isEnvVarSet(envVar: string): boolean {
    const value = process.env[envVar];
    return value !== undefined && value !== null && value.trim() !== '';
  }
}
