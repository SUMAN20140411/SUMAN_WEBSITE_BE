/**
 * Public job application submit with a resume upload.
 * The generated collection routes stay closed.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/job-applications',
      handler: 'job-application.submit',
      config: {
        auth: false,
      },
    },
  ],
};
