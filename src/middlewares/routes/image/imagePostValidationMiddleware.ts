import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { constants } from '../../../utils';
import validator from 'validator';

const MEGA_BYTE = constants.MEGA_BYTE;

export const imagePostValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.file ||
    !validator.isMimeType(req.file.mimetype) ||
    !req.file.mimetype.startsWith('image') ||
    req.file.size > 3 * MEGA_BYTE
  ) {
    throw createError(403);
  }

  next();
};
