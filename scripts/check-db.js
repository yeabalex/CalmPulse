const { loadEnvConfig } = require("@next/env");
const { MongoClient, ServerApiVersion } = require("mongodb");

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const DEFAULT_DB_NAME = "calmpulse";
const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/calmpulse";

function isAtlasUri(uri) {
  return uri.startsWith("mongodb+srv://") || uri.includes(".mongodb.net");
}

function maskMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return "[invalid MongoDB URI]";
  }
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
    serverSelectionTimeoutMS: 10_000,
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

async function run() {
  const uri = resolveMongoUri();
  const dbName = getDatabaseName(uri);
  const target = isAtlasUri(uri) ? "MongoDB Atlas" : "MongoDB";

  console.log("\x1b[36m%s\x1b[0m", `Attempting to connect to ${target}...`);
  console.log(`Connection URI: ${maskMongoUri(uri)}`);
  console.log(`Database: ${dbName}\n`);

  if (isAtlasUri(uri) && !process.env.MONGODB_DB && !new URL(uri).pathname.replace(/^\//, "")) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "Tip: your Atlas URI has no database name in the path. Set MONGODB_DB=calmpulse in .env.local"
    );
  }

  const client = new MongoClient(uri, buildClientOptions(uri));

  try {
    await client.connect();
    const db = client.db(dbName);
    await db.command({ ping: 1 });

    console.log("\x1b[32m%s\x1b[0m", `Connected successfully to ${target}!`);
    console.log(`Active database: \x1b[33m${dbName}\x1b[0m`);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.length > 0) {
      console.log("Collections:", collectionNames.join(", "));
    } else {
      console.log("No collections yet — they will be created on first signup.");
    }
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "MongoDB connection failed.");
    console.error("\x1b[33mError:\x1b[0m", error.message);

    if (isAtlasUri(uri)) {
      console.error("\nAtlas checklist:");
      console.error("  • Network Access: allow your current IP (or 0.0.0.0/0 for dev)");
      console.error("  • Database Access: user exists with read/write on the database");
      console.error("  • MONGODB_URI: correct username, password, and cluster host");
      console.error("  • MONGODB_DB: set if your URI has no database name in the path");
    }

    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
