import type { StrapiApp } from '@strapi/strapi/admin';
import { setupPasteInterceptor } from './paste-handler';

export default {
  config: {
    locales: [],
  },

  bootstrap(_app: StrapiApp) {
    setupPasteInterceptor();
  },
};
