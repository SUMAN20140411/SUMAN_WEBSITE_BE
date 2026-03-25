"use strict";

/**
 * Ensures text columns exist for Cloudinary custom fields (and related fields)
 * after media → customField migrations in the Content-Type Builder.
 *
 * Runs before 2026.03.25.01 so the backup migration can snapshot non-empty values.
 * Idempotent: safe on every deploy; only pending runs are executed by Strapi.
 *
 * PostgreSQL only (Render / production DB). SQLite/local: skipped.
 */

const COLUMNS = [
  { table: "components_philosophy_page_keywords", column: "hero" },
  { table: "components_rnd_page_research_items", column: "hero" },
  { table: "components_shared_page_infos", column: "hero" },
  { table: "ceo_pages", column: "img" },
  { table: "ceo_pages", column: "message" },
  { table: "components_notice_page_forms", column: "file" }
];

function isPostgres(knex) {
  const c = knex?.client?.config?.client;
  return c === "pg" || c === "postgres";
}

async function tableExists(knex, tableName) {
  const r = await knex.raw(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ?
     LIMIT 1`,
    [tableName]
  );
  return (r.rows ?? []).length > 0;
}

async function columnExists(knex, tableName, columnName) {
  const r = await knex.raw(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return (r.rows ?? []).length > 0;
}

async function up(knex) {
  if (!isPostgres(knex)) {
    console.log(
      "[MIGRATION] 2026.03.24.00.ensure-critical-columns — skip (not PostgreSQL)"
    );
    return;
  }

  let added = 0;
  for (const { table, column } of COLUMNS) {
    if (!(await tableExists(knex, table))) {
      console.log(
        `[MIGRATION] 2026.03.24.00 — skip ${table}.${column} (table missing yet)`
      );
      continue;
    }
    if (await columnExists(knex, table, column)) {
      continue;
    }
    await knex.raw(`ALTER TABLE "${table}" ADD COLUMN "${column}" TEXT`);
    console.log(
      `[MIGRATION] 2026.03.24.00 — added column ${table}.${column} TEXT`
    );
    added++;
  }

  console.log(
    `[MIGRATION] 2026.03.24.00.ensure-critical-columns — done (${added} column(s) added)`
  );
}

/**
 * Strapi requires `down` on JS migrations. We do not drop columns: that would
 * destroy data. To rollback, restore from backup / prior dump.
 */
async function down() {
  console.log(
    "[MIGRATION] 2026.03.24.00.ensure-critical-columns down — no-op (columns not dropped)"
  );
}

module.exports = { up, down };
