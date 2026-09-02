import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { connectMongo, disconnectMongo } from '../src/lib/mongo';

beforeAll(async () => {
  await connectMongo();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectMongo();
});
