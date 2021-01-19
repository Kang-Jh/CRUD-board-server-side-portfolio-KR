import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import createError from 'http-errors';
import { CommentsGetQuery } from '../../../types/Request/RequestQuery/CommentsGetQuery';

export const commentsGetValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    postId,
    superCommentId,
    commenterId,
    commentId,
  }: CommentsGetQuery = req.query;

  let { cursor, offset }: CommentsGetQuery = req.query;

  // must have at least one query
  if (!(postId || commenterId || superCommentId || commentId)) {
    throw createError(403);
  }

  if (commentId && !validator.isMongoId(commentId + '')) {
    throw createError(403);
  }

  if (postId && !validator.isMongoId(postId + '')) {
    throw createError(403);
  }

  if (superCommentId && !validator.isMongoId(superCommentId + '')) {
    throw createError(403);
  }

  if (commenterId && !validator.isMongoId(commenterId + '')) {
    throw createError(403);
  }

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
