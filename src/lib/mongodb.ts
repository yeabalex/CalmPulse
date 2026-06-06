import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/calmpulse";
const options = {};
const DEFAULT_DB_NAME = "calmpulse";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the connection
  // is preserved across module reloads caused by HMR.
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

function getDatabaseName() {
  if (process.env.MONGODB_DB) {
    return process.env.MONGODB_DB;
  }

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, "");
    return dbName || DEFAULT_DB_NAME;
  } catch {
    return DEFAULT_DB_NAME;
  }
}

export async function getCalmPulseDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(getDatabaseName());
}
