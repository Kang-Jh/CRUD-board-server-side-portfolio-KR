import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import createError from 'http-errors';

export const commentsParamValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!id) {
    throw createError(400);
  }

  if (id && !validator.isMongoId(id + '')) {
    throw createError(400);
  }

  next();
};
