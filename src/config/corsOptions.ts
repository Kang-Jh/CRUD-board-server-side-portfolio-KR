import { CorsOptions } from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const configOptions: CorsOptions = {
  // TODO production must not contains localhost
  origin: process.env.ORIGIN_URIs?.split(',') ?? [],
  credentials: true,
};

export default configOptions;
