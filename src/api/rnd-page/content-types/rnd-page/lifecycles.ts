const CONTENT_TYPE = 'RndPage';

export default {
  async beforeUpdate(event: any) {
    logNestedCloudinaryChanges(CONTENT_TYPE, event);
  },
  async beforeCreate(event: any) {
    logNestedCloudinaryChanges(CONTENT_TYPE, event);
  },
};

function logNestedCloudinaryChanges(label: string, event: any) {
  const { data } = event.params;
  if (!data) return;

  const section1 = data.section1;
  if (section1?.researchItems && Array.isArray(section1.researchItems)) {
    for (let i = 0; i < section1.researchItems.length; i++) {
      const item = section1.researchItems[i];
      if (item && (item.hero === null || item.hero === '' || item.hero === undefined)) {
        const stack = new Error().stack;
        strapi.log.warn(
          `[LIFECYCLE] ${label} section1.researchItems[${i}].hero is being set to "${item.hero}" ` +
          `(title: "${item.title}") — stack: ${stack}`
        );
      }
    }
  }
}
