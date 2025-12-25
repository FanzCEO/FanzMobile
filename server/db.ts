import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const dbUrl = process.env.DATABASE_URL;
const isSqlite = dbUrl.startsWith("sqlite:");
const isPostgres = dbUrl.startsWith("postgresql:") || dbUrl.startsWith("postgres:");
const isLocalhost = dbUrl.includes("127.0.0.1") || dbUrl.includes("localhost");

let db: any;
let _pool: any = null;
let dbReady: Promise<void>;
let dbInitialized = false;

// Create mock pool with connect method for health checks
function createMockPool() {
  return {
    connect: async () => {
      throw new Error('Database pool not initialized');
    },
    end: async () => {},
    query: async () => { throw new Error('Database pool not initialized'); }
  };
}

function createMockDatabase() {
  console.log(`🔧 Using mock database for development`);

  // Mock database for development when real connection fails
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }), limit: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    query: {},
  };
  _pool = createMockPool();
}

// Initialize database with async ESM imports
async function initializeDatabase(): Promise<void> {
  try {
    if (isSqlite) {
      // Try SQLite configuration with better-sqlite3
      try {
        const { default: Database } = await import('better-sqlite3');
        const { drizzle } = await import('drizzle-orm/better-sqlite3');

        const sqlite = new Database(dbUrl.replace("sqlite:", ""));
        db = drizzle(sqlite, { schema });
        dbInitialized = true;
        console.log(`🗄️ Connected to SQLite database: ${dbUrl.replace("sqlite:", "")}`);
      } catch (sqliteError: any) {
        console.warn(`⚠️ SQLite connection failed, falling back to mock database:`, sqliteError.message);
        createMockDatabase();
      }
    } else if (isPostgres) {
      try {
        if (isLocalhost) {
          // Use standard pg for local PostgreSQL connections
          // Import pg and destructure Pool from the default export
          const pgModule = await import('pg');
          const Pool = pgModule.default?.Pool || pgModule.Pool;
          const { drizzle } = await import('drizzle-orm/node-postgres');

          _pool = new Pool({
            connectionString: dbUrl,
            max: 10,
            idleTimeoutMillis: 30000,
          });

          // Test the connection
          const client = await _pool.connect();
          await client.query('SELECT 1');
          client.release();

          db = drizzle(_pool, { schema });
          dbInitialized = true;
          console.log(`🐘 Connected to local PostgreSQL database`);
        } else {
          // Use Neon serverless for remote connections
          const { Pool, neonConfig } = await import('@neondatabase/serverless');
          const { drizzle } = await import('drizzle-orm/neon-serverless');
          const ws = await import('ws');

          neonConfig.webSocketConstructor = ws.default;

          _pool = new Pool({
            connectionString: dbUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            maxUses: 7500,
            allowExitOnIdle: false
          });

          db = drizzle({ client: _pool, schema });
          dbInitialized = true;
          console.log(`🐘 Connected to PostgreSQL database (Neon serverless)`);
        }
      } catch (pgError: any) {
        console.error(`❌ PostgreSQL connection failed:`, pgError.message);
        createMockDatabase();
      }
    } else {
      throw new Error(`Unsupported database URL: ${dbUrl}`);
    }
  } catch (error: any) {
    console.error(`❌ Database connection failed:`, error.message);
    createMockDatabase();
  }
}

// Initialize synchronously with mock first, then async update
createMockDatabase();

// Run async initialization and store the promise
dbReady = initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
});

// Helper to ensure database is ready
async function waitForDb(): Promise<void> {
  await dbReady;
}

// Getter function to always return current pool value
function getPool(): any {
  return _pool;
}

// Check if database is properly initialized
function isDbReady(): boolean {
  return dbInitialized;
}

export { db, getPool, waitForDb, isDbReady };

// For backwards compatibility with code that imports 'pool' directly
export const pool = {
  connect: async () => {
    await dbReady;
    const currentPool = getPool();
    if (!currentPool || !currentPool.connect) {
      throw new Error('Database pool not initialized');
    }
    return currentPool.connect();
  },
  query: async (...args: any[]) => {
    await dbReady;
    const currentPool = getPool();
    if (!currentPool || !currentPool.query) {
      throw new Error('Database pool not initialized');
    }
    return currentPool.query(...args);
  },
  end: async () => {
    const currentPool = getPool();
    if (currentPool && currentPool.end) {
      return currentPool.end();
    }
  }
};
