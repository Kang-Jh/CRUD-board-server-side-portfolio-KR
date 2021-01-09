import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import createError from 'http-errors';
import { constants } from '../../../utils';

const { MEGA_BYTE } = constants;

function thumbnailFileValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.file) {
    if (
      !validator.isMimeType(req.file.mimetype) ||
      !req.file.mimetype.startsWith('image') ||
      req.file.size > 3 * MEGA_BYTE
    ) {
      throw createError(400);
    }
  }

  next();
}

export { thumbnailFileValidationMiddleware };
