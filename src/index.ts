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

    await diagnoseLegacyMediaMappings(strapi);
    await restoreCloudinaryFields(strapi);
    subscribeComponentWrites(strapi);
  }
};

async function diagnoseLegacyMediaMappings(strapi: Core.Strapi) {
  const knex = strapi.db.connection as any;
  const targetTypes = [
    "components::philosophy-page.keywords",
    "components::rnd-page.research-item"
  ];

  try {
    const columnTypes = await knex.raw(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND (
           (table_name = 'components_philosophy_page_keywords' AND column_name = 'hero')
           OR
           (table_name = 'components_rnd_page_research_items' AND column_name = 'hero')
         )
       ORDER BY table_name`
    );
    for (const row of columnTypes.rows ?? []) {
      strapi.log.info(
        `[SCHEMA-CHECK] ${row.table_name}.${row.column_name} type=${row.data_type}`
      );
    }
  } catch (err: any) {
    strapi.log.error(`[SCHEMA-CHECK] Failed to inspect hero column types: ${err.message}`);
  }

  try {
    const relTables = await knex.raw(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND (
           table_name LIKE 'upload%relation%'
           OR table_name LIKE 'upload%related%'
           OR table_name LIKE 'files%related%'
           OR table_name LIKE 'upload_file%orph%'
           OR table_name LIKE '%_mph'
         )
       ORDER BY table_name`
    );

    const tables = (relTables.rows ?? []).map((r: any) => r.table_name);
    if (tables.length === 0) {
      strapi.log.info("[SCHEMA-CHECK] No upload relation-like tables found");
      return;
    }

    for (const table of tables) {
      const colsRes = await knex.raw(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = ?
         ORDER BY ordinal_position`,
        [table]
      );
      const cols = (colsRes.rows ?? []).map((r: any) => r.column_name);
      const typeCol = cols.find((c: string) =>
        ["related_type", "relatedtype", "rel_type", "entity_type", "__type"].includes(c)
      );
      const fieldCol = cols.find((c: string) =>
        ["field", "attribute", "related_field", "component_field"].includes(c)
      );

      if (!typeCol) {
        continue;
      }

      const whereField = fieldCol ? ` AND "${fieldCol}" = 'hero'` : "";
      const countSql = `SELECT COUNT(*)::int AS c FROM "${table}" WHERE "${typeCol}" = ANY(?)${whereField}`;
      const countRes = await knex.raw(countSql, [targetTypes]);
      const count = countRes.rows?.[0]?.c ?? 0;

      if (count > 0) {
        strapi.log.warn(
          `[SCHEMA-CHECK] Potential stale media mappings in ${table}: ${count} rows for hero on target components`
        );
        const sampleSql = `SELECT * FROM "${table}" WHERE "${typeCol}" = ANY(?)${whereField} LIMIT 5`;
        const sampleRes = await knex.raw(sampleSql, [targetTypes]);
        for (const row of sampleRes.rows ?? []) {
          strapi.log.warn(`[SCHEMA-CHECK] Sample ${table}: ${JSON.stringify(row)}`);
        }
      } else {
        strapi.log.info(`[SCHEMA-CHECK] ${table}: no hero media mappings for target components`);
      }
    }
  } catch (err: any) {
    strapi.log.error(`[SCHEMA-CHECK] Failed to inspect upload relation tables: ${err.message}`);
  }
}

async function restoreCloudinaryFields(strapi: Core.Strapi) {
  const knex = strapi.db.connection as any;
  const backup: { table: string; id: number; column: string; value: string }[] =
    (globalThis as any).__strapiPreSyncBackup ?? [];

  if (backup.length === 0) {
    strapi.log.info(
      "[RESTORE] No pre-sync backup data found (first boot or tables were empty)"
    );
    return;
  }

  strapi.log.info(
    `[RESTORE] Pre-sync backup has ${backup.length} values. Checking for data loss...`
  );

  let restoredCount = 0;

  for (const { table, id, column, value } of backup) {
    try {
      const current = await knex.raw(
        `SELECT "${column}" FROM "${table}" WHERE id = ?`,
        [id]
      );
      const currentVal = current.rows?.[0]?.[column];

      if (
        currentVal === null ||
        currentVal === undefined ||
        currentVal === ""
      ) {
        strapi.log.warn(
          `[RESTORE] ${table}.${column} id=${id} was "${value.substring(0, 60)}..." ` +
            `but is now NULL — RESTORING`
        );
        await knex.raw(`UPDATE "${table}" SET "${column}" = ? WHERE id = ?`, [
          value,
          id
        ]);
        restoredCount++;
      }
    } catch (err: any) {
      strapi.log.error(
        `[RESTORE] Failed to check/restore ${table}.${column} id=${id}: ${err.message}`
      );
    }
  }

  if (restoredCount > 0) {
    strapi.log.warn(
      `[RESTORE] ✓ Restored ${restoredCount} values that were cleared during startup`
    );
  } else {
    strapi.log.info("[RESTORE] All values intact — no restoration needed");
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
