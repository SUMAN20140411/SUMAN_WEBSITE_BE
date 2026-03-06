import type {Core}
from '@strapi/strapi';

const config = ({env} : Core.Config.Shared.ConfigParams) : Core.Config.Plugin => ({
    'cloudinary-media-library': {
        enabled: true,
        config: {
            cloudName: env('CLOUDINARY_NAME'),
            apiKey: env('CLOUDINARY_KEY'),
            apiSecret: env('CLOUDINARY_SECRET')
        }
    }
});

export default config;
