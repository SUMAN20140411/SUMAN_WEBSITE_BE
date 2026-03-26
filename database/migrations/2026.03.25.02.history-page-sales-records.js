"use strict";

/**
 * History page → section1 → salesRecords (`history-page.sales-records`).
 * Table: components_history_page_sales_records (amount, unit, year).
 *
 * 1) Ensures columns exist (after CTB / schema drift).
 * 2) Backs up non-empty values into strapi_column_backups (idempotent).
 *
 * PostgreSQL only. Runs after 2026.03.25.01.
 */

const TABLE = "components_history_page_sales_records";

const COLUMNS = [
  { name: "amount", sqlType: "NUMERIC(20, 10)" },
  { name: "unit", sqlType: "TEXT" },
  { name: "year", sqlType: "TEXT" }
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

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function up(knex) {
  if (!isPostgres(knex)) {
    console.log(
      "[MIGRATION] 2026.03.25.02.history-page-sales-records — skip (not PostgreSQL)"
    );
    return;
  }

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

  if (!(await tableExists(knex, TABLE))) {
    console.log(
      `[MIGRATION] 2026.03.25.02 — table ${TABLE} missing yet; skip column ensure + backup`
    );
    return;
  }

  let added = 0;
  for (const { name, sqlType } of COLUMNS) {
    if (await columnExists(knex, TABLE, name)) {
      continue;
    }
    await knex.raw(`ALTER TABLE "${TABLE}" ADD COLUMN "${name}" ${sqlType}`);
    console.log(
      `[MIGRATION] 2026.03.25.02 — added ${TABLE}.${name} ${sqlType}`
    );
    added++;
  }

  const qTable = quoteIdent(TABLE);
  for (const { name } of COLUMNS) {
    const exists = await columnExists(knex, TABLE, name);
    if (!exists) {
      console.log(`[MIGRATION] 2026.03.25.02 — skip backup, column missing: ${TABLE}.${name}`);
      continue;
    }
    const qCol = quoteIdent(name);
    const result = await knex.raw(
      `
      INSERT INTO strapi_column_backups (source_table, source_column, row_id, value)
      SELECT ?, ?, id, CAST(${qCol} AS TEXT)
      FROM ${qTable}
      WHERE ${qCol} IS NOT NULL AND CAST(${qCol} AS TEXT) != ''
      ON CONFLICT (source_table, source_column, row_id) DO NOTHING
    `,
      [TABLE, name]
    );
    const n = result.rowCount ?? 0;
    console.log(
      `[MIGRATION] 2026.03.25.02 — backup ${TABLE}.${name}: up to ${n} row(s)`
    );
  }

  console.log(
    `[MIGRATION] 2026.03.25.02.history-page-sales-records — done (${added} column(s) added)`
  );
}

async function down() {
  console.log(
    "[MIGRATION] 2026.03.25.02.history-page-sales-records down — no-op (columns/backups not removed)"
  );
}

module.exports = { up, down };
