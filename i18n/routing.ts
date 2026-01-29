import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi', 'ta'],
  defaultLocale: 'en',
  localePrefix: 'never', // Don't add locale prefix to URLs
  localeCookie: {
    name: 'MARK_AI_LOCALE',
    maxAge: 31536000, // 1 year
    sameSite: 'lax'
  }
});

export type Locale = (typeof routing.locales)[number];
