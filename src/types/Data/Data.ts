import { ObjectId } from 'mongodb';

/** ID types are string of ObjectId */
export type ID = string;

export interface BaseData {
  _id: ObjectId;
  createdAt: Date;
  isDeleted: boolean;
  updatedAt?: Date;
  deletedAt?: Date;
}
