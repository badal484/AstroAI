import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * Vitest globalSetup: starts one in-memory MongoDB for the whole test run
 * and points MONGODB_URI at it before any test file (and therefore before
 * config/env.ts, which validates env eagerly at import time) loads.
 *
 * A single-node replica set, not a plain standalone server: multi-document
 * transactions (used by auth.service.ts's user+identity creation) require
 * one — a standalone mongod rejects `session.withTransaction()` outright.
 */
export default async function setup(): Promise<() => Promise<void>> {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();

  return async () => {
    await mongo.stop();
  };
}
