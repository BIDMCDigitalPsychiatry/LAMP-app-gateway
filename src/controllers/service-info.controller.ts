import { Request, Response } from "express";

const {
  ORG_OPENCONTAINERS_IMAGE_VERSION,
  ORG_OPENCONTAINERS_IMAGE_REVISION,
  ORG_OPENCONTAINERS_IMAGE_CREATED
} = process.env


export default class ServiceInfoController {
  public static healthz(req: Request, res: Response) {
    return res.status(200).json({ ok: true }).end()
  }

  public static readyz(req: Request, res: Response) {
    return res.status(200).json({ ok: true }).end()
  }

  public static metrics(req: Request, res: Response) {
    return res.status(200).json({ ok: true }).end()
  }

  public static version(req: Request, res: Response) {
    return res.status(200).json({
      version: ORG_OPENCONTAINERS_IMAGE_VERSION,
      revision: ORG_OPENCONTAINERS_IMAGE_REVISION,
      created: {
        utc: ORG_OPENCONTAINERS_IMAGE_CREATED,
      }
    }).end()
  }
}