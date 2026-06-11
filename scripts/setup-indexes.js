/* eslint-disable @typescript-eslint/no-require-imports */
const { loadEnvConfig } = require("@next/env");
const { MongoClient, ServerApiVersion } = require("mongodb");

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const DEFAULT_DB_NAME = "calmpulse";
const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/calmpulse";

function isAtlasUri(uri) {
  return uri.startsWith("mongodb+srv://") || uri.includes(".mongodb.net");
}

function resolveMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) return uri;
  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production.");
  }
  return DEFAULT_LOCAL_URI;
}

function getDatabaseName(uri) {
  if (process.env.MONGODB_DB?.trim()) return process.env.MONGODB_DB.trim();
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0];
    return dbName || DEFAULT_DB_NAME;
  } catch {
    return DEFAULT_DB_NAME;
  }
}

function buildClientOptions(uri) {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
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

async function run() {
  const uri = resolveMongoUri();
  const dbName = getDatabaseName(uri);
  const client = new MongoClient(uri, buildClientOptions(uri));

  console.log("\x1b[36m%s\x1b[0m", "Setting up CalmPulse database indexes...");

  try {
    await client.connect();
    const db = client.db(dbName);

    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ podId: 1 });
    await db.collection("pods").createIndex({ focusArea: 1, createdAt: 1 });
    await db.collection("pod_messages").createIndex({ podId: 1, createdAt: 1 });
    await db.collection("companion_messages").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("companion_memory_state").createIndex({ userId: 1, type: 1 }, { unique: true });
    await db.collection("companion_memories").createIndex({ userId: 1, updatedAt: -1 });
    // counters uses _id as the counter key — no extra index needed

    console.log("\x1b[32m%s\x1b[0m", `Indexes created on database "${dbName}".`);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "Failed to set up indexes.");
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
