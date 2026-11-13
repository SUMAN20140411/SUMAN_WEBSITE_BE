/**
 * job-application router
 *
 * Generated CRUD stays closed. Public access goes through routes/custom.ts.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::job-application.job-application' as any, {
  except: ['find', 'findOne', 'create', 'update', 'delete'],
});
