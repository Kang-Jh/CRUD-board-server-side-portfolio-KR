import createError from 'http-errors';
import UsersService from './UsersService';
import PostsService from './PostsService';
import ImagesService from './ImagesService';
import CommentsService from './CommentsService';
import WebServiceInterface from '../types/Services';
import {
  Collection,
  FindOneOptions,
  UpdateOneOptions,
  UpdateQuery,
  FilterQuery,
  ObjectId,
} from 'mongodb';
import { Comment, Image, Post, User } from '../types/Data';

export { UsersService, PostsService };

export default class WebService implements WebServiceInterface {
  usersService: UsersService;
  postsService: PostsService;
  imagesService: ImagesService;
  commentsService: CommentsService;
  s3: AWS.S3;

  constructor(
    usersCollection: Collection<User>,
    postsCollection: Collection<Post>,
    commentsCollection: Collection<Comment>,
    s3: AWS.S3
  ) {
    this.imagesService = new ImagesService(s3);
    this.usersService = new UsersService(usersCollection, s3);
    this.postsService = new PostsService(postsCollection, s3);
    this.commentsService = new CommentsService(commentsCollection);
    this.s3 = s3;
  }

  /* users services methods start */
  async findUser(user: FilterQuery<User>, options?: FindOneOptions<User>) {
    return this.usersService.findUser(user, options);
  }

  async getUserFromAccessToken(accessToken: string) {
    const { _id: userId } = await this.usersService.verifyAccessToken(
      accessToken
    );

    const user = await this.findUser(
      { _id: this.convertStringToObjectId(userId) },
      { projection: { _id: 1 } }
    );
    if (!user) {
      throw createError(403);
    }

    return user;
  }

  async createUser(user: Partial<User>) {
    return this.usersService.createUser(user);
  }

  async updateUser(
    user: FilterQuery<User>,
    update: UpdateQuery<User>,
    profilePictureFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ) {
    return this.usersService.updateUser(
      user,
      update,
      profilePictureFile,
      options
    );
  }

  async createAccessToken(id: string) {
    return this.usersService.createAccessToken(id);
  }
  async verifyAccessToken(token: string) {
    return this.usersService.verifyAccessToken(token);
  }
  async createRefreshToken(id: string) {
    return this.usersService.createRefreshToken(id);
  }
  async verifyRefreshToken(token: string) {
    return this.usersService.verifyRefreshToken(token);
  }

  async signin(accessToken: any, idToken: any, oauthServer: string) {
    return this.usersService.signin(accessToken, idToken, oauthServer);
  }
  /* users servcies methods end */

  /* posts services methods start */
  async findPost(post: FilterQuery<Post>, options?: FindOneOptions<Post>) {
    const postFromDB = await this.postsService.findPost(post, options);
    if (!postFromDB) {
      return null;
    }

    const user = await this.findUser({ _id: postFromDB.author._id });
    if (!user) {
      return null;
    }

    postFromDB.author.username = user.username;
    return postFromDB;
  }

  async findPosts(posts: FilterQuery<Post>, options?: FindOneOptions<Post>) {
    let postsFromDB = await this.postsService.findPosts(posts, options);
    postsFromDB = await Promise.all(
      postsFromDB.map(async (post) => {
        const user = await this.usersService.findUser({ _id: post.author._id });

        post.author.username = user?.username;
        return post;
      })
    );

    return postsFromDB;
  }

  async deletePost(post: FilterQuery<Post>) {
    return this.postsService.deletePost(post);
  }

  async deletePostAfterUserAuth(accessToken: string, post: FilterQuery<Post>) {
    const user = await this.getUserFromAccessToken(accessToken);
    const { _id } = post;
    const isUserAuthor = await this.findPost({ _id, author: user });
    if (!isUserAuthor) {
      throw createError(403);
    }

    return this.deletePost({ ...post, author: user });
  }

  async createPost(post: Partial<Post>, thumbnailFile?: Express.Multer.File) {
    return this.postsService.createPost(post, thumbnailFile);
  }

  async createPostAfterUserAuth(
    accessToken: string,
    post: Partial<Post>,
    thumbnailFile?: Express.Multer.File
  ) {
    const user = await this.getUserFromAccessToken(accessToken);
    const { title, contents, images } = <Post>post;
    const createdPost = await this.createPost(
      {
        title,
        contents,
        author: user,
        images,
      },
      thumbnailFile
    );

    return createdPost;
  }

  async updatePost(
    post: FilterQuery<Post>,
    update: UpdateQuery<Post>,
    thumbnailFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ) {
    return this.postsService.updatePost(post, update, thumbnailFile, options);
  }

  async updatePostAfterUserAuth(
    accessToken: string,
    post: FilterQuery<Post>,
    update: UpdateQuery<Post>,
    thumbnailFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ) {
    const user = await this.getUserFromAccessToken(accessToken);
    const { _id, title, contents, images } = <Post>post;
    const isUserAuthor = await this.findPost({ _id, author: user });
    if (!isUserAuthor) {
      throw createError(403);
    }

    return this.updatePost(
      {
        _id,
        title,
        contents,
        images,
        author: user,
      },
      update,
      thumbnailFile,
      options
    );
  }
  /* posts services methods end */

  /* images services start */
  async uploadImage(
    imageFile: Express.Multer.File,
    prefixKey: string
  ): Promise<Image> {
    return this.imagesService.uploadImage(imageFile, prefixKey);
  }

  async uploadImageAfterUserAuth(
    accessToken: string,
    imageFile: Express.Multer.File
  ): Promise<Image> {
    const user = await this.getUserFromAccessToken(accessToken);

    return this.uploadImage(imageFile, user._id.toHexString());
  }
  /* images services end */

  /* comments services start */
  async findComment(
    filter: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment | null> {
    const comment = await this.commentsService.findComment(filter, options);
    if (!comment) {
      return null;
    }
    const commenter: User | null = await this.findUser(comment.commenter, {
      projection: { username: 1 },
    });

    comment.commenter = commenter ?? comment.commenter;

    if (comment.mention) {
      const mention = await this.findUser(comment.mention, {
        projection: { username: 1 },
      });

      comment.mention = mention ?? comment.mention;
    }

    return comment;
  }

  async findComments(
    filter: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment[]> {
    let comments = await this.commentsService.findComments(filter, options);
    comments = await Promise.all(
      comments.map(async (comment) => {
        const commenter: User | null = await this.findUser(comment.commenter, {
          projection: { username: 1 },
        });

        comment.commenter = commenter ?? comment.commenter;

        if (comment.mention) {
          const mention = await this.findUser(comment.mention, {
            projection: { username: 1 },
          });

          comment.mention = mention ?? comment.mention;
        }

        return comment;
      })
    );
    return comments;
  }

  async createComment(comment: Partial<Comment>): Promise<Comment> {
    return this.commentsService.createComment(comment);
  }

  async updateComment(
    comment: FilterQuery<Comment>,
    update: UpdateQuery<Comment>,
    options?: UpdateOneOptions
  ): Promise<Comment> {
    return this.commentsService.updateComment(comment, update, options);
  }

  async deleteComment(comment: FilterQuery<Comment>): Promise<Comment> {
    return this.commentsService.deleteComment(comment);
  }

  async createCommentAfterAuth(
    accessToken: string,
    comment: Partial<Comment>
  ): Promise<Comment> {
    const user = await this.getUserFromAccessToken(accessToken);
    const { post, contents, mention, superComment } = <Comment>comment;

    return this.createComment({
      post,
      contents,
      superComment,
      mention,
      commenter: user,
    });
  }

  async updateCommentAfterUserAuth(
    accessToken: string,
    comment: FilterQuery<Comment>,
    update: UpdateQuery<Comment>,
    options?: UpdateOneOptions
  ): Promise<Comment> {
    const user = await this.getUserFromAccessToken(accessToken);
    const commentToBeUpdated = await this.findComment({
      ...comment,
      commenter: user,
    });

    if (!commentToBeUpdated) {
      throw createError(404);
    }

    if (!commentToBeUpdated.commenter._id?.equals(user._id)) {
      throw createError(403);
    }

    return this.updateComment(commentToBeUpdated, update, options);
  }

  async deleteCommentAfterUserAuth(
    accessToken: string,
    comment: FilterQuery<Comment>
  ): Promise<Comment> {
    const user = await this.getUserFromAccessToken(accessToken);

    // if user is commenter
    // user is authorized to delete comment
    const commentToBeDeleted = await this.findComment({
      ...comment,
      commenter: user,
    });
    if (!commentToBeDeleted) {
      throw createError(404);
    }

    if (commentToBeDeleted.commenter._id?.equals(user._id)) {
      return this.deleteComment(commentToBeDeleted);
    }

    // if user is post author
    // user is authorized to delete comment
    const post = await this.findPost({
      _id: commentToBeDeleted.post._id,
    });

    if (!post) {
      throw createError(404);
    }

    if (!post.author._id?.equals(user._id)) {
      throw createError(403);
    }

    return this.deleteComment(commentToBeDeleted);
  }
  /* comments services end */

  convertStringToObjectId(string: string) {
    return new ObjectId(string);
  }
}
