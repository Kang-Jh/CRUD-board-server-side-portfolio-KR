import createError from 'http-errors';
import {
  Collection,
  FilterQuery,
  FindOneOptions,
  UpdateOneOptions,
  UpdateQuery,
} from 'mongodb';
import { PostsServiceInterface } from '../types/Services';
import { Post, Image } from '../types/Data';
import { getFileExtension } from '../utils';

const POSTS_BUCKET = <string>process.env.POSTS_BUCKET;
const CLOUDFRONT_POSTS_URI = <string>process.env.CLOUDFRONT_POSTS_URI;

export default class PostsService implements PostsServiceInterface {
  postsCollection: Collection<Post>;
  s3: AWS.S3;

  constructor(postsCollection: Collection, s3: AWS.S3) {
    this.postsCollection = postsCollection;
    this.s3 = s3;
  }

  async findPost(filter: FilterQuery<Post>, options?: FindOneOptions<Post>) {
    const post: Post | null = await this.postsCollection.findOne(
      filter,
      options
    );

    if (!post) {
      return null;
    }

    let buffer;
    if (post.contents) {
      const { Body } = await this.s3
        .getObject({
          Bucket: POSTS_BUCKET,
          Key: `${post.contents}`,
        })
        .promise();
      buffer = Body;
    }

    const contents = buffer ? buffer.toString() : '';

    return { ...post, contents };
  }

  // TODO options 파라미터에서 contents를 포함시킬지 말지 결정해야함
  async findPosts(filter: FilterQuery<Post>, options?: FindOneOptions<Post>) {
    if (options?.projection?.contents === 1) {
      // contents cannot be contained in the findPosts result
      throw createError(500);
    }

    const posts: Post[] = [];
    const cursor = await this.postsCollection.find(filter, options);

    await cursor.forEach((post) => {
      posts.push(post);
    });

    return posts;
  }

  async updatePost(
    post: FilterQuery<Post>,
    update: UpdateQuery<Post>,
    thumbnailFile?: Express.Multer.File,
    options?: UpdateOneOptions,
    isCreatingPost?: boolean
  ) {
    const { _id, contents } = <Post>post;
    let thumbnail: Image | undefined;
    if (thumbnailFile) {
      thumbnail = await this.uploadThumbnail(thumbnailFile, _id.toHexString());
    }

    let uploadedContentsKey = '';
    if (contents) {
      uploadedContentsKey = await this.uploadContents(
        contents,
        _id.toHexString()
      );
    }

    let updateDoc: Partial<Post>;
    const updatedAt = isCreatingPost ? undefined : new Date();
    if (thumbnail && uploadedContentsKey) {
      updateDoc = {
        contents: uploadedContentsKey,
        thumbnail,
        updatedAt,
      };
    } else if (!thumbnail && uploadedContentsKey) {
      updateDoc = {
        contents: uploadedContentsKey,
        updatedAt,
      };
    } else if (thumbnail && !uploadedContentsKey) {
      updateDoc = {
        thumbnail,
        updatedAt,
      };
    } else {
      updateDoc = {
        updatedAt,
      };
    }

    try {
      let updateResult;
      if (_id) {
        updateResult = await this.postsCollection.findOneAndUpdate(
          { _id },
          { ...update, $set: { ...(update.$set ?? {}), ...updateDoc } },
          options
        );
      } else {
        updateResult = await this.postsCollection.findOneAndUpdate(
          post,
          { ...update, $set: { ...(update.$set ?? {}), ...updateDoc } },
          options
        );
      }

      if (!updateResult.value) {
        throw createError(404);
      }

      if (!updateResult.ok) {
        throw createError(500);
      }

      return updateResult.value;
    } catch (e) {
      if (!e.status) {
        // TODO make logs
        throw createError(500);
      }

      throw e;
    }
  }

  async permanentDeletePost(post: FilterQuery<Post>): Promise<Post> {
    const { _id } = post;
    let deletedResult;
    if (_id) {
      deletedResult = await this.postsCollection.findOneAndDelete({ _id });
    } else {
      deletedResult = await this.postsCollection.findOneAndDelete(post);
    }

    const deletedPost = deletedResult.value;
    if (!deletedPost) {
      throw createError(404);
    }

    if (deletedPost.thumbnail) {
      await this.deleteContentsAndThumbnail(
        deletedPost.contents,
        deletedPost.thumbnail.key
      );
      return deletedPost;
    }

    await this.deleteContents(deletedPost.contents);
    return deletedPost;
  }

  async permanentDeletePosts(posts: FilterQuery<Post>): Promise<Post> {
    await this.postsCollection.deleteMany(posts);
    throw new Error('Not yet implemented');
  }

  async createPost(post: Partial<Post>, thumbnailFile?: Express.Multer.File) {
    const { title, contents, author, images } = <Post>post;

    const postNumber =
      (await this.postsCollection.estimatedDocumentCount()) + 1;

    const insertResult = await this.postsCollection.insertOne({
      postNumber,
      title,
      contents: '',
      author: {
        _id: author._id,
      },
      thumbnail: {
        size: 0,
        filename: '',
        src: '',
        key: '',
        mimetype: '',
      },
      images,
      isDeleted: false,
      createdAt: new Date(),
    });
    const _id = insertResult.ops[0]._id;

    // uploading contents and thumbnail are done by using updatePost
    const updateResult = await this.updatePost(
      { _id, contents },
      {},
      thumbnailFile,
      undefined,
      true
    );

    return updateResult;
  }

  /**
   * This method doesn't delete post, it updates isDeleted field and deleteAt field
   * if you want to delete post permanently then use permanent- methods
   * @param post { Post }
   */
  async deletePost(post: FilterQuery<Post>) {
    const { _id } = post;
    let deletedResult;
    if (_id) {
      deletedResult = await this.postsCollection.findOneAndUpdate(
        {
          _id,
        },
        { $set: { deletedAt: new Date(), isDeleted: true } }
      );
    } else {
      deletedResult = await this.postsCollection.findOneAndUpdate(post, {
        $set: { deletedAt: new Date(), isDeleted: true },
      });
    }

    const deletedPost = deletedResult.value;

    if (!deletedPost) {
      throw createError(404);
    }

    return deletedPost;
  }

  // return s3 link
  private async uploadThumbnail(
    thumbnailFile: Express.Multer.File,
    id: string
  ) {
    try {
      const ext = getFileExtension(thumbnailFile.originalname);
      const key = ext ? `${id}/thumbnail.${ext}` : `${id}/thumbnail`;
      await this.s3
        .upload({
          ACL: 'public-read',
          Body: thumbnailFile.buffer,
          Bucket: POSTS_BUCKET,
          Key: key,
          ContentType: thumbnailFile.mimetype,
        })
        .promise();

      return {
        key: key,
        src: `${CLOUDFRONT_POSTS_URI}/${key}`,
        size: thumbnailFile.size,
        mimetype: thumbnailFile.mimetype,
        filename: thumbnailFile.originalname,
      };
    } catch (e) {
      throw createError(500);
    }
  }

  private async uploadContents(contents: string, id: string) {
    try {
      const key = `${id}/contents.html`;
      await this.s3
        .upload({
          Key: key,
          Body: contents,
          Bucket: POSTS_BUCKET,
          ContentType: 'text/html',
        })
        .promise();

      return key;
    } catch (e) {
      if (!e.status) {
        throw createError(500);
      }

      throw e;
    }
  }

  /**
   * delete an object from AWS s3
   * @param params {object} - which used as a parameter of s3 delete api
   */
  private async deleteObjectFroms3(params: any = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Bucket, Key } = params;

    try {
      await this.s3.deleteObject(params).promise();
    } catch (e) {
      // TODO 로그 남기기
    }
  }

  private async deleteContents(contentsKey: string) {
    if (!contentsKey) {
      return;
    }

    await this.deleteObjectFroms3({
      Bucket: POSTS_BUCKET,
      Key: contentsKey,
    });
  }

  private async deleteThumbnail(thumbnailKey: string) {
    await this.deleteObjectFroms3({
      Bucket: POSTS_BUCKET,
      Key: thumbnailKey,
    });
  }

  /**
   * delete objects from AWS s3
   * @param params {object} - which used as a parameter of s3 delete api
   */
  private async deleteObjectsFroms3(params: any = {}) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Bucket,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Delete: { Objects },
    } = params;
    try {
      await this.s3.deleteObjects(params).promise();
    } catch (e) {
      // TODO 로그 남기기
    }
  }

  private async deleteContentsAndThumbnail(
    contentsKey: string,
    thumbnailKey: string
  ) {
    const Objects: { Key: string }[] = [
      { Key: contentsKey },
      { Key: thumbnailKey },
    ];

    await this.deleteObjectsFroms3({
      Bucket: POSTS_BUCKET,
      Delete: {
        Objects,
      },
    });
  }
}
