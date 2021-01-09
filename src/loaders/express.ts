import express, { Application as ExpressApp } from 'express';
import helmet from 'helmet';

import createBrowserRouter from '../api/browser/index';
import { MongoClient } from 'mongodb';

export default async function expressLoader({
  app,
  mongoClient,
}: {
  app: ExpressApp;
  mongoClient: MongoClient;
}): Promise<void> {
  app.use(helmet());
  app.use(express.text());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/browser', createBrowserRouter(mongoClient));
}
