import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import createError from 'http-errors';
import { CommentPostRequestBody } from '../../../types/Request/RequestBody/CommentPostBody';
import { DOMPurifyInstance as DOMPurify } from '../../../utils';
import { ObjectId } from 'mongodb';

export const commentsPostValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    post,
    superComment,
    mention,
    contents,
  }: CommentPostRequestBody = req.body;

  if (
    typeof contents !== 'string' ||
    validator.isEmpty(validator.trim(contents))
  ) {
    throw createError(403);
  }

  if (!validator.isMongoId(post._id + '')) {
    throw createError(403);
  }

  if (superComment && !validator.isMongoId(superComment._id + '')) {
    throw createError(403);
  }

  if (mention && !validator.isMongoId(mention._id + '')) {
    throw createError(403);
  }

  // re-assigning prevents hidden property abussing
  req.body.post = { _id: new ObjectId(post._id) };
  req.body.superComment = superComment
    ? { _id: new ObjectId(superComment._id) }
    : null;
  req.body.mention = mention ? { _id: new ObjectId(mention._id) } : null;
  req.body.contents = DOMPurify.sanitize(contents);

  next();
};
