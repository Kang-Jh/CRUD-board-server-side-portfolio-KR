import { Application as ExpressApp } from 'express';
import expressLoader from './express';
import mongoDBLoader from './mongodb';

export default async function Loader({
  expressApp,
}: {
  expressApp: ExpressApp;
}): Promise<void> {
  const mongoClient = await mongoDBLoader();
  await expressLoader({ app: expressApp, mongoClient });
}
