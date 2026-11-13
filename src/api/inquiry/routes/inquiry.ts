/**
 * inquiry router
 *
 * Generated CRUD stays closed. Public access goes through routes/custom.ts.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::inquiry.inquiry' as any, {
  except: ['find', 'findOne', 'create', 'update', 'delete'],
});
