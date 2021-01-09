import {
  Collection,
  FilterQuery,
  FindOneOptions,
  MongoCountPreferences,
  UpdateOneOptions,
  UpdateQuery,
} from 'mongodb';
import { Comment } from '../Data';

export interface CommentsServiceInterface {
  commentsCollection: Collection<Comment>;

  findComment(
    filter: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment | null>;
  findComments(
    filter: FilterQuery<Comment>,
    options?: FindOneOptions<Comment>
  ): Promise<Comment[]>;

  createComment(comment: Partial<Comment>): Promise<Comment>;
  updateComment(
    comment: FilterQuery<Comment>,
    update: UpdateQuery<Comment>,
    options?: UpdateOneOptions
  ): Promise<Comment>;
  deleteComment(comment: FilterQuery<Comment>): Promise<Comment>;

  countSubComments(
    comment: FilterQuery<Comment>,
    options?: MongoCountPreferences
  ): Promise<number>;
}
