# Strapi database migrations

Strapi runs files in this folder (alphabetically) when there are **pending** migrations, **before** schema sync. See [Strapi database migrations](https://docs.strapi.io/dev-docs/database-migrations).

## Order (important)


| File                                       | Purpose                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `2026.03.24.00.ensure-critical-columns.js` | Adds missing `TEXT` columns for Cloudinary / richtext fields if tables exist (idempotent). Runs **first** so later steps can read/write those columns. |
| `2026.03.25.01.migrate-changed-fields.js`  | Copies current non-empty values into `strapi_column_backups` for listed table/column pairs (idempotent `ON CONFLICT DO NOTHING`).                      |
| `2026.03.25.02.history-page-sales-records.js` | Ensures `components_history_page_sales_records` columns (`amount`, `unit`, `year`) then backs them up to `strapi_column_backups`.                    |


## Permanent fix for schema drift (media → Cloudinary)

1. **`config/database.ts` → `settings.forceMigration`**  
   Schema sync runs whenever Strapi detects a metadata/DB mismatch. With **`forceMigration: false`** (default when `NODE_ENV=production`), Strapi **skips `dropColumn`, `dropTable`, and `dropIndex`** during sync — so `hero` and similar columns are not removed on cold starts.  
   New columns can still be **added**.  
   Set `DATABASE_FORCE_MIGRATION=true` on a dev machine when you intentionally remove fields in the Content-Type Builder.

2. **Migrations** add missing columns once (`2026.03.24.00`) and snapshot data (`2026.03.25.01`).

3. **`src/index.ts` bootstrap** — `ensureCriticalColumns` + `restoreFromStrapiColumnBackups` as a safety net.

## Production checklist

- Run against a **backup** or staging first.
- After deploy, confirm logs: migration messages and `[RESTORE]` / `[SCHEMA-HEAL]` if any.
- Avoid deleting/recreating the same field repeatedly in Content-Type Builder on production; change in dev, commit `schema.json`, migrate, then deploy.

## Adding a new protected column

1. Add an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` line to `2026.03.24.00.ensure-critical-columns.js` (or add a new dated migration after it).
2. Add `{ table, column }` to `TARGETS` in `2026.03.25.01.migrate-changed-fields.js`.
3. Add the same pair to `STRAPI_COLUMN_BACKUP_TARGETS` and `expectedColumns` in `src/index.ts` if you rely on bootstrap restore/heal.

