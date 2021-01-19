import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import validator from 'validator';
import { Post, Image } from '../../../types/Data';
import { DOMPurifyInstance as DOMPurify } from '../../../utils';

export const inputValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, contents }: Post = req.body;
  // because values of request body's fields are all strings
  // images should be parsed to JSON
  const images: Image[] = JSON.parse(req.body.images);

  // check title field and contents field are string
  // and images field is array
  if (
    !(
      typeof title === 'string' &&
      typeof contents === 'string' &&
      Array.isArray(images)
    )
  ) {
    throw createError(403);
  }

  // check array images contain only strings
  // and strings contained are starts with https protocol
  for (const image of images) {
    if (
      image === null ||
      typeof image !== 'object' ||
      !image.src.startsWith('https')
    ) {
      throw createError(403);
    }
  }

  // chech title and contents are empty
  if (
    validator.isEmpty(validator.trim(title)) ||
    validator.isEmpty(validator.trim(contents)) ||
    contents.replace(/<p><br><\/p>/g, '').length === 0
  ) {
    throw createError(403);
  }

  // sanitize title and contents
  const cleanTitle = DOMPurify.sanitize(title);
  const cleanContents = DOMPurify.sanitize(contents);
  req.body.title = cleanTitle;
  req.body.contents = cleanContents;
  req.body.images = images;

  next();
};
