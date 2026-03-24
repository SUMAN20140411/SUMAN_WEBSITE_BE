import type { Core } from '@strapi/strapi';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const dbConfig = strapi.config.get('database.connection');
    const client = (dbConfig as any)?.client ?? 'unknown';
    strapi.log.info(`[BOOTSTRAP] Database client: ${client}`);

    if (client === 'postgres') {
      try {
        const knex = strapi.db.connection;
        const result = await (knex as any).raw('SELECT current_database(), current_user, version()');
        const row = result.rows?.[0];
        strapi.log.info(
          `[BOOTSTRAP] Connected to PostgreSQL - db: ${row?.current_database}, user: ${row?.current_user}`
        );
      } catch (err) {
        strapi.log.error(`[BOOTSTRAP] PostgreSQL connection check failed: ${err}`);
      }
    } else if (client === 'sqlite') {
      strapi.log.warn(
        '[BOOTSTRAP] Running on SQLite - data will NOT survive cold starts on Render!'
      );
    }

    await auditRawDatabase(strapi);
    subscribeComponentWrites(strapi);
  },
};

async function auditRawDatabase(strapi: Core.Strapi) {
  const knex = strapi.db.connection as any;

  const queries = [
    {
      label: 'PhilosophyPage keywords (hero = Cloudinary URL)',
      sql: `SELECT id, title, hero FROM components_philosophy_page_keywords ORDER BY id`,
    },
    {
      label: 'RndPage research items (hero = Cloudinary URL)',
      sql: `SELECT id, title, hero FROM components_rnd_page_research_items ORDER BY id`,
    },
    {
      label: 'CeoPage (img = Cloudinary URL, message = richtext)',
      sql: `SELECT id, title, img, LENGTH(message) as message_len, LEFT(message, 80) as message_preview FROM ceo_pages ORDER BY id`,
    },
    {
      label: 'PageInfo shared component (hero = Cloudinary URL)',
      sql: `SELECT id, title, hero FROM components_shared_page_infos ORDER BY id`,
    },
  ];

  for (const { label, sql } of queries) {
    try {
      const result = await knex.raw(sql);
      const rows = result.rows ?? [];
      strapi.log.info(`[RAW-AUDIT] ${label}: ${rows.length} rows`);
      for (const row of rows) {
        strapi.log.info(`[RAW-AUDIT]   ${JSON.stringify(row)}`);
      }
    } catch (err: any) {
      strapi.log.warn(`[RAW-AUDIT] ${label}: query failed - ${err.message}`);
    }
  }
}

function subscribeComponentWrites(strapi: Core.Strapi) {
  const watchedModels = [
    'philosophy-page.keywords',
    'rnd-page.research-item',
    'shared.page-info',
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
      if (heroVal === null || heroVal === undefined || heroVal === '') {
        strapi.log.warn(
          `[COMPONENT-WRITE] ⚠ ${model.uid} hero is EMPTY on create (title: ${JSON.stringify(titleVal)})`
        );
      }
    },

    async beforeUpdate(event: any) {
      const { model, params } = event;
      const data = params?.data;
      if (!data) return;
      if ('hero' in data) {
        const heroVal = data.hero;
        strapi.log.info(
          `[COMPONENT-WRITE] beforeUpdate ${model.uid} id=${params?.where?.id} — ` +
          `hero: ${JSON.stringify(heroVal)}`
        );
        if (heroVal === null || heroVal === undefined || heroVal === '') {
          strapi.log.warn(
            `[COMPONENT-WRITE] ⚠ ${model.uid} id=${params?.where?.id} hero being SET TO EMPTY`
          );
        }
      }
    },
  });

  strapi.log.info(`[BOOTSTRAP] Component write subscribers registered for: ${watchedModels.join(', ')}`);
}
