import type {Core}
from '@strapi/strapi';

const config = ({env} : Core.Config.Shared.ConfigParams) : Core.Config.Plugin => {
    const smtpPort = env.int('SMTP_PORT', 587);

    return {
    'cloudinary-media-library': {
        enabled: true,
        config: {
            cloudName: env('CLOUDINARY_NAME'),
            apiKey: env('CLOUDINARY_KEY'),
            apiSecret: env('CLOUDINARY_SECRET')
        }
    },
    email: {
        config: {
            provider: 'nodemailer',
            providerOptions: {
                host: env('SMTP_HOST', ''),
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: env('SMTP_USERNAME', ''),
                    pass: env('SMTP_PASSWORD', '')
                }
            },
            settings: {
                defaultFrom: env('SMTP_DEFAULT_FROM', 'noreply@localhost'),
                defaultReplyTo: env('SMTP_DEFAULT_REPLY_TO', 'noreply@localhost')
            }
        }
    }
    };
};

export default config;
