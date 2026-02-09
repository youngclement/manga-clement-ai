import { MongoClient } from 'mongodb';
import { requireEnv } from '@/lib/utils/env';

const MONGODB_URI = requireEnv('MONGODB_URI');
const DB_NAME = 'manga-generator';
let cachedClient: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  cachedClient = await clientPromise;
  return cachedClient;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}

export async function getCollection<T = any>(collectionName: string) {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    clientPromise = null;
  }
}
