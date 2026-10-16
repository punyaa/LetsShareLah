import { randomUUID } from "node:crypto";

export function createMemoryStore() {
  const listings = [];
  return {
    mode: "memory",
    async list() { return listings.slice(0, 100); },
    async publish(listing) {
      const published = { ...listing, id: randomUUID(), createdAt: new Date().toISOString() };
      listings.unshift(published);
      return published;
    },
    async health() { return true; },
    async close() {}
  };
}

export async function createMongoStore(uri, databaseName = "letssharelah") {
  if (!uri.startsWith("mongodb+srv://") && !uri.startsWith("mongodb://")) throw new Error("MONGODB_URI must be a MongoDB connection string.");
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(databaseName)) throw new Error("MONGODB_DB has an invalid name.");
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 });
  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });
    const collection = db.collection("listings");
    return {
      mode: "atlas",
      async list() {
        const docs = await collection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
        return docs;
      },
      async publish(listing) {
        const published = { ...listing, id: randomUUID(), createdAt: new Date().toISOString() };
        await collection.insertOne(published);
        return published;
      },
      async health() { await db.command({ ping: 1 }); return true; },
      async close() { await client.close(); }
    };
  } catch (error) {
    await client.close();
    throw error;
  }
}
