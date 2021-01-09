import { ID } from '../../Data';

export interface CommentsGetQuery {
  commentId?: ID;
  commenterId?: ID;
  superCommentId?: ID;
  postId?: ID;
  cursor?: number;
  offset?: number;
}
