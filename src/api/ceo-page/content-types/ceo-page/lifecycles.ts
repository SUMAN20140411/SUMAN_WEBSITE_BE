const CONTENT_TYPE = 'CeoPage';

export default {
  async beforeUpdate(event: any) {
    const { data } = event.params;
    if (!data) return;

    if (data.img === null || data.img === '' || data.img === undefined) {
      const stack = new Error().stack;
      strapi.log.warn(
        `[LIFECYCLE] ${CONTENT_TYPE} img (Cloudinary) is being set to "${data.img}" — stack: ${stack}`
      );
    }

    if (data.message === null || data.message === '' || data.message === undefined) {
      const stack = new Error().stack;
      strapi.log.warn(
        `[LIFECYCLE] ${CONTENT_TYPE} message (richtext) is being set to "${data.message}" — stack: ${stack}`
      );
    }
  },
};
