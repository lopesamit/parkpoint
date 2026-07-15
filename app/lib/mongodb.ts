import { MongoClient } from "mongodb";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Cache the connection promise across HMR reloads in dev and across
// invocations in prod. Connecting lazily (on first query, not at import
// time) keeps builds and cold starts from dialing the database.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  if (!globalWithMongo._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set. Add it to your environment.");
    }
    const client = new MongoClient(uri, options);
    // Don't cache a failed connection: clear the slot so the next
    // request retries (e.g. after credentials or network are fixed).
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      globalWithMongo._mongoClientPromise = undefined;
      void client.close().catch(() => {});
      throw error;
    });
  }
  return globalWithMongo._mongoClientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db("data");
}

export async function getCollection(name: string) {
  const db = await getDb();
  return db.collection(name);
}
