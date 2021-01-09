import {
  Collection,
  UpdateOneOptions,
  UpdateQuery,
  FilterQuery,
  FindOneOptions,
} from 'mongodb';
import { Post } from '../Data';

// TODO CRUD 메소드에 options 파라미터 추가
export interface PostsServiceInterface {
  postsCollection: Collection<Post>;
  s3: AWS.S3;

  findPost(
    post: FilterQuery<Post>,
    options?: FindOneOptions<Post>
  ): Promise<Post | null>;
  findPosts(
    posts: FilterQuery<Post>,
    options?: FindOneOptions<Post>
  ): Promise<Post[]>;
  createPost(
    post: Partial<Post>,
    imageFile?: Express.Multer.File
  ): Promise<Post>;
  updatePost(
    post: FilterQuery<Post>,
    update: UpdateQuery<Post>,
    imageFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ): Promise<Post>;
  deletePost(post: FilterQuery<Post>): Promise<Post>;
  permanentDeletePost(post: FilterQuery<Post>): Promise<Post>;
  permanentDeletePosts(posts: FilterQuery<Post>): Promise<Post>;
}
