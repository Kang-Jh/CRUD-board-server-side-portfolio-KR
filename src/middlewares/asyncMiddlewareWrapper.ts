import { Request, Response, Handler } from 'express';
import createError from 'http-errors';

interface AsyncMiddleware {
  (req: Request, res: Response): Promise<void>;
}

/**
 * create async middleware wrapper
 *
 * it makes async middleware prefixed with async doesn't have to use try/catch inside the middleware to catch async error,
 * so that it catches errors occured inside the async middleware.
 * if next middleware exist
 * so middleware should whether end request-response cycle
 * @param asyncMiddleware - express async middleware
 * @param hasNext - default value is false
 */
export function asyncMiddlewareWrapper(
  asyncMiddleware: AsyncMiddleware,
  hasNext = false
): Handler {
  return async (req, res, next) => {
    try {
      await asyncMiddleware(req, res);
      if (hasNext) {
        next();
      }
    } catch (e) {
      if (!e.status) {
        next(createError(500));
      }
      next(e);
    }
  };
}
