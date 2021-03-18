import { Router } from 'express';
import { FilterQuery, FindOneOptions, MongoClient } from 'mongodb';
import cors from 'cors';
import csrf from 'csurf';
import {
  asyncMiddlewareWrapper as aMW,
  authorizationHeaderValidationMiddleware,
  postsGetQueryValidation,
  postsRoutePatchValidationMiddlewares,
  postsRoutePostValidationMiddlewares,
  imagePostValidationMiddleware,
  commentsGetValidationMiddleware,
  commentsPostValidationMiddleware,
  commentsParamValidationMiddleware,
} from '../../middlewares';
import corsOptions from '../../config/corsOptions';
import csrfOptions from '../../config/csrfOptions';
import WebService from '../../services/index';
import { SigninBody } from '../../types/Request/RequestBody/SigninBody';
import { Comment, Post, DecodedToken } from '../../types/Data';
import cookieParser from 'cookie-parser';
import ms from 'ms';
import validator from 'validator';
import createError from 'http-errors';
import multer from 'multer';
import AWS from 'aws-sdk';
import { getAccessToken, constants } from '../../utils';
import { CommentsGetQuery } from '../../types/Request/RequestQuery/CommentsGetQuery';
import { CommentPostRequestBody } from '../../types/Request/RequestBody/CommentPostBody';

const { COMMENTS_GET_LIMIT, POSTS_GET_LIMIT } = constants;

const upload = multer();
const csrfMiddleware = csrf(csrfOptions);

const environment = process.env.NODE_ENV?.toUpperCase();
function createBrowserRouter(mongoClient: MongoClient) {
  const database = mongoClient.db(
    environment === 'PRODUCTION'
      ? process.env.DB_NAME_PRODUCTION
      : process.env.DB_NAME_DEVELOPMENT
  );
  const UsersCollection = database.collection(
    environment === 'PRODUCTION'
      ? <string>process.env.USERS_COLLECTION_NAME_PRODUCTION
      : <string>process.env.USERS_COLLECTION_NAME_DEVELOPMENT
  );
  const PostsCollection = database.collection(
    environment === 'PRODUCTION'
      ? <string>process.env.POSTS_COLLECTION_NAME_PRODUCTION
      : <string>process.env.POSTS_COLLECTION_NAME_DEVELOPMENT
  );
  const CommentsCollection = database.collection(
    environment === 'PRODUCTION'
      ? <string>process.env.COMMENTS_COLLECTION_NAME_PRODUCTION
      : <string>process.env.COMMENTS_COLLECTION_NAME_DEVELOPMENT
  );

  const S3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'ap-northeast-2' });

  const webService = new WebService(
    UsersCollection,
    PostsCollection,
    CommentsCollection,
    S3
  );
  const browserRouter = Router();

  browserRouter.use(cors(corsOptions));
  browserRouter.use(cookieParser());

  // GET /csrfToken
  browserRouter.get('/csrfToken', csrfMiddleware, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // POST /signin
  browserRouter.post(
    '/signin',
    csrfMiddleware,
    // validate inputs
    (req, res, next) => {
      try {
        const { oauthServer }: SigninBody = req.body;

        validator.isAlpha(oauthServer);
        // FIXME remove oauthServer === 'fake' in production
        if (
          !(
            oauthServer === 'google' ||
            oauthServer === 'facebook' ||
            oauthServer === 'fake'
          )
        ) {
          throw 'Wrong Authorization Server';
        }

        next();
      } catch (e) {
        next(createError(400));
      }
    },
    aMW(async (req, res) => {
      // google signin doesn't have accessToken
      const {
        accessToken: accessTokenFromRequest,
        id: oauthID,
        oauthServer,
      }: SigninBody = req.body;

      const { refreshToken, user } = await webService.signin(
        accessTokenFromRequest,
        oauthID,
        oauthServer
      );

      // TODO cookie options: httpOnly, secure, expire(30day), path: /accessToken
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: ms('30d'),
        sameSite: 'none',
        secure: true,
      });
      res.json({ user });
    })
  );

  // POST /signout
  browserRouter.post(
    '/signout',
    csrfMiddleware,
    aMW(async (req, res) => {
      res.clearCookie('refreshToken');
      res.status(200).json(null);
    })
  );

  // GET /accessToken
  browserRouter.get(
    '/accessToken',
    aMW(async (req, res) => {
      const refreshToken = req.cookies['refreshToken'];

      const decoded: DecodedToken = await webService.verifyRefreshToken(
        refreshToken
      );

      const accessToken = await webService.createAccessToken(decoded._id);

      res.json({ accessToken });
    })
  );

  // GET /signedInUser
  browserRouter.get(
    '/users/signedInUser',
    aMW(async (req, res) => {
      const refreshToken = req.cookies['refreshToken'];

      const decoded: DecodedToken = await webService.verifyRefreshToken(
        refreshToken
      );

      const user = await webService.findUser(
        { _id: webService.convertStringToObjectId(decoded._id) },
        { projection: { username: 1 } }
      );

      res.json(user);
    })
  );

  // GET /posts
  browserRouter.get(
    '/posts',
    postsGetQueryValidation,
    aMW(async (req, res) => {
      const cursor = Number(req.query.cursor);
      const offset = Number(req.query.offset);

      const posts = await webService.findPosts(
        { postNumber: { $gte: cursor }, isDeleted: false },
        {
          sort: { _id: 1 },
          limit: POSTS_GET_LIMIT,
          skip: offset,
          projection: {
            postNumber: 1,
            title: 1,
            thumbnail: 1,
            author: 1,
            createdAt: 1,
            images: 1,
          },
        }
      );

      res.json(posts);
    })
  );

  // GET /posts/:id
  browserRouter.get(
    '/posts/:id',
    aMW(async (req, res) => {
      const postId = req.params.id;
      const post = await webService.findPost(
        { _id: webService.convertStringToObjectId(postId), isDeleted: false },
        {
          projection: {
            title: 1,
            contents: 1,
            thumbnail: 1,
            createdAt: 1,
            updatedAt: 1,
            author: 1,
            images: 1,
          },
        }
      );

      if (!post) {
        throw createError(404);
      }

      res.json(post);
    })
  );

  // POST /posts
  browserRouter.post(
    '/posts',
    upload.single('thumbnail'),
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    postsRoutePostValidationMiddlewares,
    aMW(async (req, res) => {
      const accessToken = getAccessToken(req.headers.authorization);
      const { title, contents, images }: Post = req.body;
      const post = await webService.createPostAfterUserAuth(
        accessToken,
        {
          title,
          contents,
          images,
        },
        req.file
      );

      res.json({ _id: post._id });
    })
  );

  // PATCH /posts/:id
  browserRouter.patch(
    '/posts/:id',
    upload.single('thumbnail'),
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    postsRoutePatchValidationMiddlewares,
    aMW(async (req, res) => {
      const postId = req.params.id;
      const accessToken = getAccessToken(req.headers.authorization);
      const { title, contents, images }: Post = req.body;

      const updatedPost = await webService.updatePostAfterUserAuth(
        accessToken,
        {
          _id: webService.convertStringToObjectId(postId),
          title,
          contents,
          images,
        },
        { $set: { title, images } },
        req.file
      );

      res.json({ _id: updatedPost._id });
    })
  );

  // DELETE /posts/:id
  browserRouter.delete(
    '/posts/:id',
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    aMW(async (req, res) => {
      const postId = req.params.id;
      const accessToken = getAccessToken(req.headers.authorization);

      await webService.deletePostAfterUserAuth(accessToken, {
        _id: webService.convertStringToObjectId(postId),
      });

      res.json({ success: true });
    })
  );

  // POST /image
  browserRouter.post(
    '/image',
    upload.single('image'),
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    imagePostValidationMiddleware,
    aMW(async (req, res) => {
      const accessToken = getAccessToken(req.headers.authorization);

      const image = await webService.uploadImageAfterUserAuth(
        accessToken,
        req.file
      );

      res.json(image);
    })
  );

  // GET /comments
  browserRouter.get(
    '/comments',
    commentsGetValidationMiddleware,
    aMW(async (req, res) => {
      const { postId, superCommentId, commenterId } = <CommentsGetQuery>(
        (<unknown>req.query)
      );

      let { cursor, offset } = <CommentsGetQuery>(<unknown>req.query);

      cursor = validator.toInt(cursor + '');
      offset = validator.toInt(offset + '');

      const options: FindOneOptions<Comment> = {
        sort: {
          _id: 1,
        },
        skip: offset,
        limit: COMMENTS_GET_LIMIT,
        projection: {
          commentNumber: 1,
          contents: 1,
          createdAt: 1,
          updatedAt: 1,
          superComment: 1,
          mention: 1,
          commenter: 1,
          post: 1,
        },
      };

      const superCommentObjectId = superCommentId
        ? webService.convertStringToObjectId(superCommentId)
        : null;

      const postObjectId = postId
        ? webService.convertStringToObjectId(postId)
        : null;
      const commenterObjectId = commenterId
        ? webService.convertStringToObjectId(commenterId)
        : null;

      const postFilter: FilterQuery<Comment> = postObjectId
        ? { post: { _id: postObjectId } }
        : {};

      const superCommentFilter: FilterQuery<Comment> = superCommentObjectId
        ? { superComment: { _id: superCommentObjectId } }
        : { superComment: null };

      const commenterFilter: FilterQuery<Comment> = commenterObjectId
        ? { commenter: { _id: commenterObjectId } }
        : {};

      const filter: FilterQuery<Comment> = {
        ...postFilter,
        ...superCommentFilter,
        ...commenterFilter,
        commentNumber: { $gte: cursor },
        isDeleted: false,
      };

      const comments = await webService.findComments(filter, options);

      res.json(comments);
    })
  );

  // POST /comments
  browserRouter.post(
    '/comments',
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    commentsPostValidationMiddleware,
    aMW(async (req, res) => {
      const accessToken = getAccessToken(req.headers.authorization);
      const {
        contents,
        post,
        superComment,
        mention,
      }: CommentPostRequestBody = req.body;

      await webService.createCommentAfterAuth(accessToken, {
        post,
        contents,
        superComment,
        mention,
      });

      res.json({ success: true });
    })
  );

  browserRouter.put(
    '/comments/:id',
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    commentsParamValidationMiddleware,
    commentsPostValidationMiddleware,
    aMW(async (req, res) => {
      const accessToken = getAccessToken(req.headers.authorization);
      const { id } = req.params;
      const commentId = webService.convertStringToObjectId(id);
      const { contents }: CommentPostRequestBody = req.body;

      await webService.updateCommentAfterUserAuth(
        accessToken,
        { _id: commentId, contents },
        { $set: { contents } }
      );

      res.json({ success: true });
    })
  );

  browserRouter.delete(
    '/comments/:id',
    csrfMiddleware,
    authorizationHeaderValidationMiddleware,
    commentsParamValidationMiddleware,
    aMW(async (req, res) => {
      const accessToken = getAccessToken(req.headers.authorization);
      const { id } = req.params;
      const commentId = webService.convertStringToObjectId(id);

      await webService.deleteCommentAfterUserAuth(accessToken, {
        _id: commentId,
      });

      res.json({ success: true });
    })
  );

  return browserRouter;
}

export default createBrowserRouter;
