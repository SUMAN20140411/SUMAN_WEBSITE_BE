import type { Core } from "@strapi/strapi";

const config: Core.Config.Middlewares = [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://market-assets.strapi.io",
            // cloudinary related
            "https://console.cloudinary.com",
            "https://res.cloudinary.com",
            // map plugin related
            "https://*.basemaps.cartocdn.com",
            "https://*.tile.openstreetmap.org",
            "https://unpkg.com/leaflet@1.9.4/dist/images/"
          ],
          "script-src": [
            "'self'",
            "unsafe-inline",
            "example.com",
            // cloudinary related
            "https://media-library.cloudinary.com",
            "https://upload-widget.cloudinary.com",
            "https://console.cloudinary.com",
            // map plugin related
            "https://*.basemaps.cartocdn.com"
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            // cloudinary related
            "https://console.cloudinary.com",
            "https://res.cloudinary.com",
            // map plugin related
            "https://*.basemaps.cartocdn.com",
            "https://tile.openstreetmap.org",
            "https://*.tile.openstreetmap.org"
          ],
          "frame-src": [
            "'self'",
            "https://media-library.cloudinary.com",
            "https://upload-widget.cloudinary.com",
            "https://console.cloudinary.com"
          ],
          upgradeInsecureRequests: null
        }
      }
    }
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public"
];

export default config;
