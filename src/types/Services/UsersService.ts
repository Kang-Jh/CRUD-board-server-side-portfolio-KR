import {
  Collection,
  FindOneOptions,
  UpdateOneOptions,
  UpdateQuery,
  FilterQuery,
} from 'mongodb';
import { User, RefreshToken } from '../Data';

// TODO CRUD 메소드에 options 파라미터 추가
export interface UsersServiceInterface {
  usersCollection: Collection<User>;
  s3: AWS.S3;

  findUser(
    user: FilterQuery<User>,
    options?: FindOneOptions<User>
  ): Promise<User | null>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(
    user: FilterQuery<User>,
    update: UpdateQuery<User>,
    imageFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ): Promise<User>;
  signin(
    oauthAccessToken: any, // this accessToken coming from OAuth provider
    idToken: any,
    oauthServer: string
  ): Promise<{ refreshToken: RefreshToken } & { user: Partial<User> }>;
  createAccessToken(_id: string): Promise<string>;
  verifyAccessToken(token: string): Promise<any>;
  createRefreshToken(_id: string): Promise<string>;
  verifyRefreshToken(token: string): Promise<any>;
}
