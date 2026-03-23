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
  },
};
