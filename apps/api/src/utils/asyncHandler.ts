import type { NextFunction, Request, Response } from "express";

type AsyncController<Req extends Request = Request, Res extends Response = Response> = (
  req: Req,
  res: Res,
  next: NextFunction
) => unknown | Promise<unknown>;

export const asyncHandler = <Req extends Request = Request, Res extends Response = Response>(
  handler: AsyncController<Req, Res>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req as Req, res as Res, next)).catch(next);
  };
};
