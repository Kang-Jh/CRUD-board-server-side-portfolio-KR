import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import loaders from './loaders';

async function startServer() {
  const app = express();

  await loaders({ expressApp: app });

  app.listen(4000, () => {
    console.log('app running');
  });
}

startServer();
