/**
 * Public intake and progress routes.
 * The generated collection routes stay closed to the public role.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/test-requests/intake',
      handler: 'test-request.intake',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/test-requests/status',
      handler: 'test-request.status',
      config: {
        auth: false,
      },
    },
  ],
};
