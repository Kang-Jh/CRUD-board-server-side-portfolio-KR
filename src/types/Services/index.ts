import { UsersServiceInterface } from './UsersService';
import { PostsServiceInterface } from './PostsService';
import { ImagesServiceInterface } from './ImagesService';
import { CommentsServiceInterface } from './CommentsService';
import { Post, User, Image, Comment, RefreshToken } from '../Data';
import {
  FindOneOptions,
  UpdateOneOptions,
  UpdateQuery,
  FilterQuery,
  ObjectId,
} from 'mongodb';

export { UsersServiceInterface, PostsServiceInterface };

// TODO CRUD 메소드에 accessToken, postId 등을 옵션 파라미터로 전환
export default interface WebServiceInterface {
  usersService: UsersServiceInterface;
  postsService: PostsServiceInterface;
  imagesService: ImagesServiceInterface;
  commentsService: CommentsServiceInterface;
  s3: AWS.S3;

  /* users services start */
  findUser(
    user: FilterQuery<User>,
    options?: FindOneOptions<User>
  ): Promise<User | null>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(
    user: FilterQuery<User>,
    update: UpdateQuery<User>,
    profilePictureFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ): Promise<User>;
  createAccessToken(_id: string): Promise<string>;
  verifyAccessToken(token: string): Promise<any>;
  createRefreshToken(_id: string): Promise<string>;
  verifyRefreshToken(token: string): Promise<any>;
  signin(
    accessToken: any,
    idToken: any,
    oauthServer: string
  ): Promise<{ refreshToken: RefreshToken } & { user: Partial<User> }>;

  getUserFromAccessToken(accessToken: string): Promise<User>;
  /* users services end */

  /* posts services start */
  findPost(
    post: FilterQuery<Post>,
    options?: FindOneOptions<Post>
  ): Promise<Post | null>;
  findPosts(
    posts: FilterQuery<Post>,
    options: FindOneOptions<Post>
  ): Promise<Post[]>;
  createPost(
    post: Partial<Post>,
    thumbnailFile?: Express.Multer.File
  ): Promise<Post>;
  updatePost(
    post: FilterQuery<Post>,
    update: UpdateQuery<Post>,
    thumbnailFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ): Promise<Post>;
  deletePost(post: FilterQuery<Post>, user: Partial<User>): Promise<Post>;

  createPostAfterUserAuth(
    accessToken: string,
    post: Partial<Post>,
    thumbnailFile?: Express.Multer.File
  ): Promise<Post>;
  updatePostAfterUserAuth(
    accessToken: string,
    post: FilterQuery<Post>,
    update: UpdateQuery<Post>,
    thumbnailFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ): Promise<Post>;
  deletePostAfterUserAuth(
    accessToken: string,
    post: FilterQuery<Post>
  ): Promise<Post>;
  /* posts services end */

  /* images services start */
  uploadImage(
    imageFile: Express.Multer.File,
    prefixKey: string
  ): Promise<Image>;
  uploadImageAfterUserAuth(
    accessToken: string,
    imageFile: Express.Multer.File
  ): Promise<Image>;
  /* images services end */

  /* comments services start */
  findComment(
    comment: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment | null>;
  findComments(
    comment: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment[]>;
  createComment(comment: Partial<Comment>): Promise<Comment>;
  updateComment(
    comment: FilterQuery<Comment>,
    update: UpdateQuery<Comment>,
    options?: UpdateOneOptions
  ): Promise<Comment>;
  deleteComment(comment: FilterQuery<Comment>): Promise<Comment>;

  createCommentAfterAuth(
    accessToken: string,
    comment: Partial<Comment>
  ): Promise<Comment>;
  updateCommentAfterUserAuth(
    accessToken: string,
    comment: FilterQuery<Comment>,
    update: UpdateQuery<Comment>,
    options?: UpdateOneOptions
  ): Promise<Comment>;
  deleteCommentAfterUserAuth(
    accessToken: string,
    comment: FilterQuery<Comment>
  ): Promise<Comment>;

  convertStringToObjectId(string: string): ObjectId;
}
