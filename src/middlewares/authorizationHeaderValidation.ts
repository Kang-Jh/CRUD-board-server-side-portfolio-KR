import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

export function authorizationHeaderValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.headers.authorization) {
    throw createError(401);
  }

  const authorizationHeader = req.headers.authorization.split(' ');
  if (authorizationHeader[0].toLowerCase() !== 'bearer') {
    throw createError(400);
  }

  next();
}
