import { asyncMiddlewareWrapper } from './asyncMiddlewareWrapper';
import { authorizationHeaderValidationMiddleware } from './authorizationHeaderValidation';
import {
  postsRoutePutValidationMiddlewares,
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
  postsRoutePutValidationMiddlewares,
  postsRoutePostValidationMiddlewares,
  imagePostValidationMiddleware,
  commentsGetValidationMiddleware,
  commentsPostValidationMiddleware,
  postsGetQueryValidation,
  commentsParamValidationMiddleware,
};
