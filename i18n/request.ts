import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
import {routing} from './routing';

export default getRequestConfig(async () => {
  // Get locale from cookie, fall back to default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('MARK_AI_LOCALE');
  
  let locale = localeCookie?.value || routing.defaultLocale;
  
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
