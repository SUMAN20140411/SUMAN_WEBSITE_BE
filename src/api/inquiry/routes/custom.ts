/**
 * Public inquiry submit, and a password-gated list.
 * The generated collection routes stay closed.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/inquiries',
      handler: 'inquiry.submit',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiries',
      handler: 'inquiry.list',
      config: {
        auth: false,
      },
    },
  ],
};
