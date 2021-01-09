import createError from 'http-errors';
import {
  Collection,
  FilterQuery,
  FindOneOptions,
  UpdateQuery,
  UpdateOneOptions,
  MongoCountPreferences,
} from 'mongodb';
import { Comment } from '../types/Data';
import { CommentsServiceInterface } from '../types/Services/CommentsService';

export default class CommentsService implements CommentsServiceInterface {
  commentsCollection: Collection<Comment>;

  constructor(commentsCollection: Collection<Comment>) {
    this.commentsCollection = commentsCollection;
  }

  async findComment(
    filter: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment | null> {
    const { _id } = filter;
    let comment: Comment | null;
    if (_id) {
      comment = await this.commentsCollection.findOne({ _id }, options);
    } else {
      comment = await this.commentsCollection.findOne(filter, options);
    }

    if (!comment) {
      return null;
    }

    if (!comment.superComment) {
      comment.subCommentsCount = await this.countSubComments({
        superComment: { _id: comment._id },
      });
    }

    return comment;
  }

  async findComments(
    filter: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment[]> {
    const cursor = await this.commentsCollection.find(filter, options);
    let comments: Comment[] = [];

    await cursor.forEach((comment) => {
      comment.subComments = !comment.superComment ? [] : undefined;
      comments.push(comment);
    });

    comments = await Promise.all(
      comments.map(async (comment) => {
        comment.subCommentsCount = !comment.superComment
          ? await this.countSubComments({ superComment: { _id: comment._id } })
          : undefined;

        return comment;
      })
    );

    return comments;
  }

  async createComment(comment: Partial<Comment>): Promise<Comment> {
    const { commenter, post, contents, mention, superComment } = <Comment>(
      comment
    );

    // if comment is a sub-comment
    // commentNumber
    let commentNumber: number;
    if (superComment) {
      commentNumber = (await this.countSubComments({ post, superComment })) + 1;
    } else {
      commentNumber =
        (await this.countSubComments({ post, superComment: null })) + 1;
    }

    const insertResult = await this.commentsCollection.insertOne({
      commentNumber,
      contents,
      commenter,
      post,
      mention,
      superComment,
      isDeleted: false,
      createdAt: new Date(),
    });

    return insertResult.ops[0];
  }

  async updateComment(
    comment: FilterQuery<Comment>,
    update: UpdateQuery<Comment>,
    options?: UpdateOneOptions
  ): Promise<Comment> {
    const { _id } = comment;
    let updateResult;
    if (_id) {
      updateResult = await this.commentsCollection.findOneAndUpdate(
        { _id },
        { ...update, $set: { ...(update.$set ?? {}), updatedAt: new Date() } },
        options
      );
    } else {
      updateResult = await this.commentsCollection.findOneAndUpdate(
        comment,
        { ...update, $set: { ...(update.$set ?? {}), updatedAt: new Date() } },
        options
      );
    }

    if (!updateResult.value) {
      throw createError(404);
    }

    return updateResult.value;
  }

  async deleteComment(comment: FilterQuery<Comment>): Promise<Comment> {
    const { _id } = comment;
    let deleteResult;
    if (_id) {
      deleteResult = await this.commentsCollection.findOneAndUpdate(
        { _id },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
    } else {
      deleteResult = await this.commentsCollection.findOneAndUpdate(comment, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
    }

    if (!deleteResult.value) {
      throw createError(404);
    }

    return deleteResult.value;
  }

  async countSubComments(
    comment: FilterQuery<Comment>,
    options?: MongoCountPreferences
  ): Promise<number> {
    return this.commentsCollection.countDocuments(comment, options);
  }
}
