import { postIdParamValidationMiddleware } from './postIdParamValidation';
import { thumbnailFileValidationMiddleware } from './thumbnailFileValidation';
import { inputValidationMiddleware } from './inputValidation';
import { postsGetQueryValidation } from './postsGetQueryValidation';

export const postsRoutePatchValidationMiddlewares = [
  thumbnailFileValidationMiddleware,
  postIdParamValidationMiddleware,
  inputValidationMiddleware,
];

export const postsRoutePostValidationMiddlewares = [
  thumbnailFileValidationMiddleware,
  inputValidationMiddleware,
];

export { postsGetQueryValidation };
