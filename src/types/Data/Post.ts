import { Image } from './Image';
import { BaseData } from './Data';
import { User } from './User';
import { Comment } from './Comment';

export interface Post extends BaseData {
  postNumber: number; // post number can be duplicated and inaccurate
  title: string;
  author: Required<Pick<User, '_id'>> & Partial<User>;
  thumbnail?: Image; // id + thumbnail represent s3 key
  contents: string; // id + contents represent s3 key
  images: Image[]; // if contents has embeded images, which stored in s3, these images links should be stored to delete images when contents is deleted
  comments?: (Required<Pick<Comment, '_id'>> & Partial<Comment>)[]; // comments aren't stored in Posts Collection, comments are queried from Comments Collection
}
