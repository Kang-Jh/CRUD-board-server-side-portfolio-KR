import { Comment } from './Comment';
import { BaseData } from './Data';
import { Post } from './Post';

export interface User extends BaseData {
  oauthID: string; // oauthID is app-scoped unique id provided by social login service provider
  oauthServer: string; // oauthServer is what provider users use to social log in
  email: string;
  username: string;
  posts?: Partial<Post>[]; // posts are not stored in the document, posts are queried from Posts Collection
  comments?: Partial<Comment>[]; // comments are not stored in the document, comments are queried from Comments Collection
}
