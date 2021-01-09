import {
  Collection,
  FilterQuery,
  FindOneOptions,
  UpdateOneOptions,
  UpdateQuery,
} from 'mongodb';
import { UsersServiceInterface } from '../types/Services';
import createError from 'http-errors';
import { User } from '../types/Data';
import nodeFetch from 'node-fetch';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { promisifyJWTSign, promisifyJWTVerify } from '../utils';

const environment = process.env.NODE_ENV?.toUpperCase();

const ACCESS_TOKEN_SECRET_KEY =
  environment === 'PRODUCTION'
    ? process.env.ACCESS_TOKEN_SECRET_KEY_PRODUCTION
    : process.env.ACCESS_TOKEN_SECRET_KEY_DEVELOPMENT;
const REFRESH_TOKEN_SECRET_KEY =
  environment === 'PRODUCTION'
    ? process.env.REFRESH_TOKEN_SECRET_KEY_PRODUCTION
    : process.env.REFRESH_TOKEN_SECRET_KEY_DEVELOPMENT;

const FACEBOOK_GRAPH_API_BASE_URI = process.env.FACEBOOK_GRAPH_API_BASE_URI;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleOAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);
export default class UsersService implements UsersServiceInterface {
  usersCollection: Collection<User>;
  s3: AWS.S3;

  constructor(usersCollection: Collection, s3: AWS.S3) {
    this.usersCollection = usersCollection;
    this.s3 = s3;
  }

  async findUser(filter: FilterQuery<User>, options?: FindOneOptions<User>) {
    return this.usersCollection.findOne(filter, options);
  }

  async createUser(user: Partial<User>) {
    try {
      const { oauthServer, oauthID, email, username } = <User>user;
      const insertResult = await this.usersCollection.insertOne({
        oauthID: oauthID ?? '',
        oauthServer: oauthServer ?? '',
        email: email ?? '',
        username: username ?? '',
        isDeleted: false,
        createdAt: new Date(),
      });

      return insertResult.ops[0];
    } catch (e) {
      throw createError(500);
    }
  }

  // TODO change parameters
  async updateUser(
    user: FilterQuery<User>,
    update: UpdateQuery<User>,
    profilePictureFile?: Express.Multer.File,
    options?: UpdateOneOptions
  ) {
    try {
      // TODO upload profile picture

      const validatedUpdate: UpdateQuery<User> = {
        ...update,
        $set: { ...(update.$set ?? {}) /*, profilePicture */ },
      };

      let updateResult;
      if (user.id) {
        updateResult = await this.usersCollection.findOneAndUpdate(
          { id: user.id },
          validatedUpdate,
          options
        );
      } else {
        updateResult = await this.usersCollection.findOneAndUpdate(
          user,
          validatedUpdate,
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
        throw createError(500);
      }

      throw e;
    }
  }

  async createAccessToken(_id: string) {
    try {
      const token = await promisifyJWTSign(
        { _id },
        <string>ACCESS_TOKEN_SECRET_KEY,
        {
          expiresIn: '3h',
        }
      );
      return token;
    } catch (e) {
      throw createError(500);
    }
  }

  async verifyAccessToken(token: string) {
    try {
      const decoded = await promisifyJWTVerify(
        token,
        <string>ACCESS_TOKEN_SECRET_KEY
      );
      return decoded;
    } catch (e) {
      throw createError(401);
    }
  }

  async createRefreshToken(_id: string) {
    try {
      const token = await promisifyJWTSign(
        { _id },
        <string>REFRESH_TOKEN_SECRET_KEY,
        {
          expiresIn: '30d',
        }
      );
      return token;
    } catch (e) {
      throw createError(500);
    }
  }

  async verifyRefreshToken(token: string) {
    try {
      const decoded = await promisifyJWTVerify(
        token,
        <string>REFRESH_TOKEN_SECRET_KEY
      );
      return decoded;
    } catch (e) {
      throw createError(401);
    }
  }

  async signin(oauthAccessToken: any, idToken: any, oauthServer: string) {
    // variable to store fixed id from SNS services
    const basicInfo = await this.getBasicInfoFromOAuthResourceServer(
      oauthAccessToken,
      idToken,
      oauthServer
    );

    const { oauthID } = basicInfo;
    let user = await this.findUser({ oauthID, oauthServer }, {});
    if (!user) {
      user = await this.register({ ...basicInfo, oauthServer });
    }

    const jwtRefreshToken = await this.createRefreshToken(
      (<User>user)._id.toHexString()
    );

    return {
      refreshToken: jwtRefreshToken,
      user: {
        _id: (user as User)._id,
      },
    };
  }

  /**
   * @return appAccessToken
   */
  private async getFacebookAppAccessToken(): Promise<string> {
    const response = await nodeFetch(
      `${FACEBOOK_GRAPH_API_BASE_URI}/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&grant_type=client_credentials`
    );

    const json = await response.json();
    const { access_token: accessToken } = json;

    return accessToken;
  }

  /**
   * when access token is not valid token then it throws error
   * @param accessToken accessToken that should be validated
   * @param appAccessToken app's access token
   */
  private async verifyFacebookAccessToken(
    accessToken: string,
    appAccessToken: string
  ): Promise<void> {
    const response = await nodeFetch(
      `${FACEBOOK_GRAPH_API_BASE_URI}/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
    );

    const json = await response.json();
    const {
      data: { is_valid: isValid },
    } = json;

    if (!isValid) {
      throw null;
    }
  }

  /**
   * return basic info about facebook log-in user
   * @param accessToken
   * @param id app-scoped facebook unique id
   */
  private async getBasicInfoFromFacebook(accessToken: string, id: string) {
    try {
      const appAccessToken = await this.getFacebookAppAccessToken();

      await this.verifyFacebookAccessToken(accessToken, appAccessToken);

      const userInfoResponse = await nodeFetch(
        `${FACEBOOK_GRAPH_API_BASE_URI}/${id}?fields=id,name,email&access_token=${accessToken}`
      );

      const json = await userInfoResponse.json();
      if (!userInfoResponse.ok) {
        const { error } = json;
        throw error;
      }

      const { id: oauthID, email, name: username } = json;
      return {
        oauthID,
        email,
        username,
      };
    } catch (e) {
      throw createError(401, 'Facebook unauthorized user');
    }
  }

  private async verifyGoogleIdToken(id: string): Promise<TokenPayload> {
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: id,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() as TokenPayload;

    return payload;
  }

  // google can change email address, but google id is fixed id for google account(app-scoped)
  // google accept only id token
  private async getBasicInfoFromGoogle(id: string) {
    try {
      const payload = await this.verifyGoogleIdToken(id);
      const { sub: oauthID, email, email_verified, name: username } = payload;

      return {
        oauthID,
        email: email_verified ? email : '',
        username,
      };
    } catch (e) {
      throw createError(401, 'Google unauthorized user');
    }
    // get user email from google
  }

  private async getBasicInfoFromOAuthResourceServer(
    accessToken: string,
    id: string,
    oauthServer: string
  ) {
    switch (oauthServer) {
      case 'facebook':
        return this.getBasicInfoFromFacebook(accessToken, id);
      case 'google':
        return this.getBasicInfoFromGoogle(id);
      // FIXME remove fake case in production mode
      case 'fake':
        return {
          username: 'Fake Account',
          email: 'FakeAccount@FakeEmailAddress.com',
          oauthID: 'FakeOAuthID',
        };
      default:
        throw createError(400);
    }
  }

  private async register({
    oauthID,
    oauthServer,
    email,
    username,
  }: {
    oauthID: string;
    oauthServer: string;
    email: string;
    username: string;
  }) {
    return this.createUser({
      oauthServer,
      oauthID,
      email,
      username,
    });
  }
}
