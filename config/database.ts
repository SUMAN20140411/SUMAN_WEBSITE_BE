import path from "path";
import type { Core } from "@strapi/strapi";

let preSyncAuditDone = false;

interface CloudinaryBackupRow {
  table: string;
  id: number;
  column: string;
  value: string;
}

const preSyncBackup: CloudinaryBackupRow[] = [];

async function preSyncAudit(conn: any) {
  if (preSyncAuditDone) return;
  preSyncAuditDone = true;

  try {
    const settings = await conn.query(
      `SELECT name, setting FROM pg_settings WHERE name IN ('synchronous_commit', 'wal_level', 'fsync')`
    );
    console.log(
      "[PRE-SYNC] PostgreSQL durability settings:",
      JSON.stringify(settings.rows)
    );
  } catch (e: any) {
    console.log("[PRE-SYNC] Could not read pg_settings:", e.message);
  }

  const columnsToBackup = [
    { table: "components_philosophy_page_keywords", column: "hero" },
    { table: "components_rnd_page_research_items", column: "hero" },
    { table: "components_shared_page_infos", column: "hero" },
    { table: "ceo_pages", column: "img" },
    { table: "ceo_pages", column: "message" }
  ];

  for (const { table, column } of columnsToBackup) {
    try {
      const result = await conn.query(
        `SELECT id, ${column} FROM ${table} WHERE ${column} IS NOT NULL AND ${column} != '' ORDER BY id`
      );
      for (const row of result.rows) {
        preSyncBackup.push({ table, id: row.id, column, value: row[column] });
      }
      console.log(
        `[PRE-SYNC] ${table}.${column}: ${result.rows.length} non-null rows backed up`
      );
    } catch (e: any) {
      console.log(`[PRE-SYNC] ${table}.${column}: ${e.message}`);
    }
  }

  console.log(`[PRE-SYNC] Total backed up values: ${preSyncBackup.length}`);
}

(globalThis as any).__strapiPreSyncBackup = preSyncBackup;

const config = ({
  env
}: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env("DATABASE_CLIENT", "sqlite");

  const connections: Record<string, any> = {
    mysql: {
      connection: {
        host: env("DATABASE_HOST", "localhost"),
        port: env.int("DATABASE_PORT", 3306),
        database: env("DATABASE_NAME", "strapi"),
        user: env("DATABASE_USERNAME", "strapi"),
        password: env("DATABASE_PASSWORD", "strapi"),
        ssl: env.bool("DATABASE_SSL", false) && {
          key: env("DATABASE_SSL_KEY", undefined),
          cert: env("DATABASE_SSL_CERT", undefined),
          ca: env("DATABASE_SSL_CA", undefined),
          capath: env("DATABASE_SSL_CAPATH", undefined),
          cipher: env("DATABASE_SSL_CIPHER", undefined),
          rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", true)
        }
      },
      pool: {
        min: env.int("DATABASE_POOL_MIN", 2),
        max: env.int("DATABASE_POOL_MAX", 10)
      }
    },
    postgres: {
      connection: {
        connectionString: env("DATABASE_URL"),
        host: env("DATABASE_HOST", "localhost"),
        port: env.int("DATABASE_PORT", 5432),
        database: env("DATABASE_NAME", "strapi"),
        user: env("DATABASE_USERNAME", "strapi"),
        password: env("DATABASE_PASSWORD", "strapi"),
        ssl: env.bool("DATABASE_SSL", false) && {
          rejectUnauthorized: env.bool(
            "DATABASE_SSL_REJECT_UNAUTHORIZED",
            false
          )
        },
        schema: env("DATABASE_SCHEMA", "public")
      },
      pool: {
        min: env.int("DATABASE_POOL_MIN", 0),
        max: env.int("DATABASE_POOL_MAX", 10),
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
        afterCreate: (conn: any, done: (err: any, conn: any) => void) => {
          conn.query("SET synchronous_commit = on", (err: any) => {
            if (err) {
              console.error(
                "[POOL] Failed to set synchronous_commit:",
                err.message
              );
              return done(err, conn);
            }
            preSyncAudit(conn)
              .then(() => done(null, conn))
              .catch(() => done(null, conn));
          });
        }
      }
    },
    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          "..",
          "..",
          env("DATABASE_FILENAME", ".tmp/data.db")
        )
      },
      useNullAsDefault: true
    }
  };

  if (client === "sqlite" && env("NODE_ENV") === "production") {
    console.warn(
      "[DATABASE] WARNING: Using SQLite in production! Data WILL be lost on cold start. " +
        "Set DATABASE_CLIENT=postgres in your environment variables."
    );
  }

  console.log(`[DATABASE] Using client: ${client}`);

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000)
    }
  };
};

export default config;
