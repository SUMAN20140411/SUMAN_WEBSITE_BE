import type { Core } from "@strapi/strapi";

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const dbConfig = strapi.config.get("database.connection");
    const client = (dbConfig as any)?.client ?? "unknown";
    strapi.log.info(`[BOOTSTRAP] Database client: ${client}`);

    if (client === "postgres") {
      try {
        const knex = strapi.db.connection;
        const result = await (knex as any).raw(
          "SELECT current_database(), current_user, version()"
        );
        const row = result.rows?.[0];
        strapi.log.info(
          `[BOOTSTRAP] Connected to PostgreSQL - db: ${row?.current_database}, user: ${row?.current_user}`
        );
      } catch (err) {
        strapi.log.error(
          `[BOOTSTRAP] PostgreSQL connection check failed: ${err}`
        );
      }
    } else if (client === "sqlite") {
      strapi.log.warn(
        "[BOOTSTRAP] Running on SQLite - data will NOT survive cold starts on Render!"
      );
    }

    await ensureCriticalColumns(strapi);
    await restoreFromStrapiColumnBackups(strapi);
    subscribeComponentWrites(strapi);
  }
};

async function ensureCriticalColumns(strapi: Core.Strapi) {
  const knex = strapi.db.connection as any;
  const expectedColumns = [
    {
      table: "components_philosophy_page_keywords",
      column: "hero",
      sqlType: "text"
    },
    {
      table: "components_rnd_page_research_items",
      column: "hero",
      sqlType: "text"
    },
    {
      table: "components_shared_page_infos",
      column: "hero",
      sqlType: "text"
    },
    {
      table: "ceo_pages",
      column: "img",
      sqlType: "text"
    },
    {
      table: "ceo_pages",
      column: "message",
      sqlType: "text"
    },
    {
      table: "components_notice_page_forms",
      column: "file",
      sqlType: "text"
    }
  ];

  for (const { table, column, sqlType } of expectedColumns) {
    try {
      const existsRes = await knex.raw(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = ?
           AND column_name = ?
         LIMIT 1`,
        [table, column]
      );
      const exists = (existsRes.rows ?? []).length > 0;
      if (!exists) {
        await knex.raw(
          `ALTER TABLE "${table}" ADD COLUMN "${column}" ${sqlType}`
        );
        strapi.log.warn(
          `[SCHEMA-HEAL] Added missing column "${table}"."${column}" (${sqlType})`
        );
      }
    } catch (err: any) {
      strapi.log.error(
        `[SCHEMA-HEAL] Failed checking/creating "${table}"."${column}": ${err.message}`
      );
    }
  }
}

/**
 * Tables/columns populated by database/migrations/2026.03.25.01 and
 * 2026.03.25.02 (strapi_column_backups). Restore reads only that table.
 */
const STRAPI_COLUMN_BACKUP_TARGETS: { table: string; column: string }[] = [
  { table: "components_philosophy_page_keywords", column: "hero" },
  { table: "components_rnd_page_research_items", column: "hero" },
  { table: "components_shared_page_infos", column: "hero" },
  { table: "ceo_pages", column: "img" },
  { table: "ceo_pages", column: "message" },
  { table: "components_notice_page_forms", column: "file" }
];

function quoteSqlIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function isEmptyCell(val: unknown) {
  if (val === null || val === undefined) return true;
  if (val === "") return true;
  if (typeof val === "string" && val.trim() === "") return true;
  return false;
}

async function restoreFromStrapiColumnBackups(strapi: Core.Strapi) {
  const dbConfig = strapi.config.get("database.connection") as any;
  const client = dbConfig?.client ?? "unknown";
  if (client !== "postgres") {
    return;
  }

  const knex = strapi.db.connection as any;

  let tableExists = false;
  try {
    const r = await knex.raw(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'strapi_column_backups'
       LIMIT 1`
    );
    tableExists = (r.rows ?? []).length > 0;
  } catch (err: any) {
    strapi.log.error(
      `[RESTORE] Could not check strapi_column_backups: ${err.message}`
    );
    return;
  }

  if (!tableExists) {
    strapi.log.info(
      "[RESTORE] strapi_column_backups missing — run DB migrations or first backup not created yet"
    );
    return;
  }

  const parts: string[] = [];
  const bindings: string[] = [];
  for (const t of STRAPI_COLUMN_BACKUP_TARGETS) {
    parts.push("(source_table = ? AND source_column = ?)");
    bindings.push(t.table, t.column);
  }

  let rows: {
    source_table: string;
    source_column: string;
    row_id: number;
    value: string;
  }[] = [];

  try {
    const rowsRes = await knex.raw(
      `SELECT source_table, source_column, row_id, value
       FROM strapi_column_backups
       WHERE ${parts.join(" OR ")}
       ORDER BY source_table, source_column, row_id`,
      bindings
    );
    rows = rowsRes.rows ?? [];
  } catch (err: any) {
    strapi.log.error(
      `[RESTORE] Failed to read strapi_column_backups: ${err.message}`
    );
    return;
  }

  if (rows.length === 0) {
    strapi.log.info(
      "[RESTORE] No rows for known targets in strapi_column_backups"
    );
    return;
  }

  strapi.log.info(
    `[RESTORE] Checking ${rows.length} row(s) from strapi_column_backups`
  );

  let restoredCount = 0;

  for (const row of rows) {
    const table = row.source_table;
    const column = row.source_column;
    const id = row.row_id;
    const value = row.value;

    try {
      const colExistsRes = await knex.raw(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
         LIMIT 1`,
        [table, column]
      );
      if ((colExistsRes.rows ?? []).length === 0) {
        continue;
      }

      const qTable = quoteSqlIdent(table);
      const qCol = quoteSqlIdent(column);
      const current = await knex.raw(
        `SELECT ${qCol} AS c FROM ${qTable} WHERE id = ?`,
        [id]
      );
      const currentVal = current.rows?.[0]?.c;

      if (!isEmptyCell(currentVal) || !value || String(value).length === 0) {
        continue;
      }

      strapi.log.warn(
        `[RESTORE] Restoring ${table}.${column} id=${id} from strapi_column_backups`
      );
      await knex.raw(`UPDATE ${qTable} SET ${qCol} = ? WHERE id = ?`, [
        value,
        id
      ]);
      restoredCount++;
    } catch (err: any) {
      strapi.log.error(
        `[RESTORE] Failed ${table}.${column} id=${id}: ${err.message}`
      );
    }
  }

  if (restoredCount > 0) {
    strapi.log.warn(
      `[RESTORE] Restored ${restoredCount} cell(s) from strapi_column_backups`
    );
  } else {
    strapi.log.info("[RESTORE] strapi_column_backups — nothing to restore");
  }
}

function subscribeComponentWrites(strapi: Core.Strapi) {
  const watchedModels = [
    "philosophy-page.keywords",
    "rnd-page.research-item",
    "shared.page-info"
  ];

  strapi.db.lifecycles.subscribe({
    models: watchedModels,

    async beforeCreate(event: any) {
      const { model, params } = event;
      const data = params?.data;
      if (!data) return;
      const heroVal = data.hero;
      const titleVal = data.title;
      strapi.log.info(
        `[COMPONENT-WRITE] beforeCreate ${model.uid} — ` +
          `title: ${JSON.stringify(titleVal)}, hero: ${JSON.stringify(heroVal)}`
      );
    },

    async beforeUpdate(event: any) {
      const { model, params } = event;
      const data = params?.data;
      if (!data) return;
      if ("hero" in data) {
        const heroVal = data.hero;
        strapi.log.info(
          `[COMPONENT-WRITE] beforeUpdate ${model.uid} id=${params?.where?.id} — ` +
            `hero: ${JSON.stringify(heroVal)}`
        );
      }
    }
  });

  strapi.log.info(
    `[BOOTSTRAP] Component write subscribers registered for: ${watchedModels.join(", ")}`
  );
}
