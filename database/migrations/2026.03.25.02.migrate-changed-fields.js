"use strict";

/**
 * Snapshots at-risk Strapi columns into strapi_column_backups before schema sync
 * can drop or recreate them. Idempotent: safe on every deploy.
 */
const TARGETS = [
  { table: "ceo_pages", column: "message" },
  { table: "components_philosophy_page_keywords", column: "hero" },
  { table: "components_rnd_page_research_items", column: "hero" },
  { table: "components_notice_page_forms", column: "file" }
];

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

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function up(knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS strapi_column_backups (
      id SERIAL PRIMARY KEY,
      source_table TEXT NOT NULL,
      source_column TEXT NOT NULL,
      row_id INTEGER NOT NULL,
      value TEXT NOT NULL,
      backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT strapi_column_backups_unique_row UNIQUE (source_table, source_column, row_id)
    )
  `);

  for (const { table, column } of TARGETS) {
    const exists = await columnExists(knex, table, column);
    if (!exists) {
      console.log(
        `[MIGRATION] Skip backup — column missing: ${table}.${column}`
      );
      continue;
    }

    const qTable = quoteIdent(table);
    const qCol = quoteIdent(column);
    const result = await knex.raw(
      `
      INSERT INTO strapi_column_backups (source_table, source_column, row_id, value)
      SELECT ?, ?, id, CAST(${qCol} AS TEXT)
      FROM ${qTable}
      WHERE ${qCol} IS NOT NULL AND CAST(${qCol} AS TEXT) != ''
      ON CONFLICT (source_table, source_column, row_id) DO NOTHING
    `,
      [table, column]
    );

    const n = result.rowCount ?? 0;
    console.log(`[MIGRATION] Backup ${table}.${column}: inserted up to ${n} row(s)`);
  }
}

module.exports = { up };
