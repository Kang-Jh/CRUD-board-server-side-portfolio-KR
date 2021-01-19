import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import createError from 'http-errors';

export function postIdParamValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const postId = req.params.id;
  if (!validator.isMongoId(postId + '')) {
    throw createError(403);
  }

  next();
}
