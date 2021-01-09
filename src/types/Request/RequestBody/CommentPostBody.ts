import { Comment, Post, User } from '../../Data';

export interface CommentPostRequestBody {
  post: Partial<Post>;
  contents: string;
  mention?: Partial<User>;
  superComment?: Partial<Comment>;
}
