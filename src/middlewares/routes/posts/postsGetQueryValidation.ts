import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { PostsGetQuery } from '../../../types/Request/RequestQuery/PostsGetQuery';

export const postsGetQueryValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { cursor, offset }: PostsGetQuery = req.query;

  if (!cursor) {
    cursor = 0;
  }

  if (!offset) {
    offset = 0;
  }

  if (cursor && !validator.isInt(cursor + '', { min: 0 })) {
    cursor = 0;
  }

  if (offset && !validator.isInt(offset + '', { min: 0 })) {
    offset = 0;
  }

  req.query.cursor = cursor + '';
  req.query.offset = offset + '';

  next();
};
