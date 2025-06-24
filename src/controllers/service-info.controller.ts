import { Request, Response } from "express";

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
}