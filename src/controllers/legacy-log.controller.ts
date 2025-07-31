

import { Request, Response } from "express";
import LegacyNotificationService from "../services/legacy-notifications.service";
import { Config } from "../config";

interface LogRequest {
  origin?: string;
  level?: string;
  stream?: string;
}

export default class LegacyLogController {
  private readonly notificationService: LegacyNotificationService;
  private readonly config: Config;
  
  constructor(config: Config, legacyNotificationService: LegacyNotificationService) {
    this.notificationService = legacyNotificationService
    this.config = config;
  }

  // Logging driver code. Note: For legacy compatibility, routing to `/` is enabled.
  // Try it using: `http PUT :3000 origin==test level==info <<<'testing log!'`
  public async log(req: Request<{}, {}, string, LogRequest>, res: Response) {
    // Some types of logging messages are not allowed (PHI, etc.)
    if (typeof req.body !== 'string' || req.body.includes("Protected health data is inaccessible"))
      return res.status(200).json({ "warning": "log message was ignored" });
    
    // Shortcut for sending a slack message instead of a log. [DEPRECATED]
    if (req.query.stream === 'slack') {
      await this.notificationService.SLACKpush(this.config.deprecated.SLACK_HOOK, { content: (req.body || '').trim() });
      return res.status(200).json({ "destination": "slack" });
    } else {
      console.log(`[${req.query.level || 'info'}] [${req.query.origin || 'unknown'}] ${(req.body || '').trim()}`);
      return res.status(200).json({});
    }
  }
}