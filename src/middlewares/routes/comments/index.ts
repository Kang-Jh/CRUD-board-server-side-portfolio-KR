import { commentsPostValidationMiddleware } from './commentsPostValidation';
import { commentsGetValidationMiddleware } from './commentsGetQueryValidation';
import { commentsParamValidationMiddleware } from './commentsParamValidation';

export {
  commentsGetValidationMiddleware,
  commentsPostValidationMiddleware,
  commentsParamValidationMiddleware,
};
