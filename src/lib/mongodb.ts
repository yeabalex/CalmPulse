import { Db, MongoClient, type MongoClientOptions, ServerApiVersion } from "mongodb";

const DEFAULT_DB_NAME = "calmpulse";
const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/calmpulse";

function isAtlasUri(uri: string): boolean {
  return uri.startsWith("mongodb+srv://") || uri.includes(".mongodb.net");
}

function resolveMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    return uri;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MONGODB_URI is required in production. Add your MongoDB Atlas connection string to the environment."
    );
  }

  return DEFAULT_LOCAL_URI;
}

function buildClientOptions(uri: string): MongoClientOptions {
  const options: MongoClientOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    connectTimeoutMS: 10_000,
  };

  if (isAtlasUri(uri)) {
    options.serverApi = {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    };
  }

  return options;
}

export function maskMongoUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = "****";
    }
    return parsed.toString();
  } catch {
    return "[invalid MongoDB URI]";
  }
}

function getClusterHost(uri: string): string {
  try {
    return new URL(uri).hostname;
  } catch {
    return "unknown";
  }
}

function logConnectionSuccess(uri: string, dbName: string): void {
  const atlas = isAtlasUri(uri);
  const host = getClusterHost(uri);

  if (atlas) {
    console.log("\x1b[32m%s\x1b[0m", "[MongoDB Atlas] Connected successfully");
    console.log(`  Cluster: ${host}`);
    console.log(`  Database: ${dbName}`);
    console.log(`  URI: ${maskMongoUri(uri)}`);
    return;
  }

  console.log(
    `\x1b[32m[MongoDB] Local connection successful. Database: ${dbName} (${host})\x1b[0m`
  );
}

function logConnectionFailure(uri: string, errMsg: string): void {
  const atlas = isAtlasUri(uri);
  console.error(
    `\x1b[31m[MongoDB${atlas ? " Atlas" : ""}] Failed to connect: ${errMsg}\x1b[0m`
  );

  if (atlas) {
    console.error(`  Cluster: ${getClusterHost(uri)}`);
    console.error(`  URI: ${maskMongoUri(uri)}`);
    console.error(
      "\x1b[33m[MongoDB Atlas] Checklist: IP allowlist, user credentials, MONGODB_URI, MONGODB_DB\x1b[0m"
    );
  }
}

function getDatabaseName(uri: string): string {
  if (process.env.MONGODB_DB?.trim()) {
    return process.env.MONGODB_DB.trim();
  }

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0];
    return dbName || DEFAULT_DB_NAME;
  } catch {
    return DEFAULT_DB_NAME;
  }
}

const uri = resolveMongoUri();
const clientOptions = buildClientOptions(uri);
const databaseName = getDatabaseName(uri);

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, clientOptions);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, clientOptions);
  clientPromise = client.connect();
}

export default clientPromise;

const atlas = isAtlasUri(uri);
console.log(
  `\x1b[36m[MongoDB] Connecting to ${atlas ? "MongoDB Atlas" : "local MongoDB"} (${getClusterHost(uri)})...\x1b[0m`
);

clientPromise
  .then(async (clientInstance) => {
    try {
      const db = clientInstance.db(databaseName);
      await db.command({ ping: 1 });
      logConnectionSuccess(uri, databaseName);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `\x1b[33m[MongoDB${atlas ? " Atlas" : ""}] Connected, but ping failed: ${errMsg}\x1b[0m`
      );
    }
  })
  .catch((err) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    logConnectionFailure(uri, errMsg);
  });

export async function getCalmPulseDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(databaseName);
}

export function getMongoDatabaseName(): string {
  return databaseName;
}
