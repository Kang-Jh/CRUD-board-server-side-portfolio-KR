import { MongoClient } from 'mongodb';

const environment = process.env.NODE_ENV?.toUpperCase();
const mongoURI =
  environment === 'PRODUCTION'
    ? <string>process.env.MONGODB_URI_PRODUCTION
    : <string>process.env.MONGODB_URI_DEVELOPMENT;

async function mongodbLoader() {
  const client = new MongoClient(mongoURI, {
    useUnifiedTopology: true,
  });

  await client.connect();

  return client;
}

export default mongodbLoader;
