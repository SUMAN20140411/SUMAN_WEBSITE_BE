const CONTENT_TYPE = 'PhilosophyPage';

export default {
  async beforeUpdate(event: any) {
    logCloudinaryFieldChanges(CONTENT_TYPE, event);
  },
  async beforeCreate(event: any) {
    logCloudinaryFieldChanges(CONTENT_TYPE, event);
  },
};

function logCloudinaryFieldChanges(label: string, event: any) {
  const { data } = event.params;
  if (!data) return;

  const keywords = data.keywords;
  if (Array.isArray(keywords)) {
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      if (kw && (kw.hero === null || kw.hero === '' || kw.hero === undefined)) {
        const stack = new Error().stack;
        strapi.log.warn(
          `[LIFECYCLE] ${label} keywords[${i}].hero is being set to "${kw.hero}" ` +
          `(title: "${kw.title}") — stack: ${stack}`
        );
      }
    }
  }
}
