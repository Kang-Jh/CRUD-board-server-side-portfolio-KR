import { asyncMiddlewareWrapper } from './asyncMiddlewareWrapper';
import { authorizationHeaderValidationMiddleware } from './authorizationHeaderValidation';
import {
  postsRoutePatchValidationMiddlewares,
  postsRoutePostValidationMiddlewares,
  postsGetQueryValidation,
} from './routes/posts';
import { imagePostValidationMiddleware } from './routes/image';
import {
  commentsGetValidationMiddleware,
  commentsPostValidationMiddleware,
  commentsParamValidationMiddleware,
} from './routes/comments';

export {
  asyncMiddlewareWrapper,
  authorizationHeaderValidationMiddleware,
  postsRoutePatchValidationMiddlewares,
  postsRoutePostValidationMiddlewares,
  imagePostValidationMiddleware,
  commentsGetValidationMiddleware,
  commentsPostValidationMiddleware,
  postsGetQueryValidation,
  commentsParamValidationMiddleware,
};
