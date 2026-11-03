import { Platform } from 'react-native';
import { SENTRY_DSN } from './sentryConfig';

/**
 * Supervision des erreurs de la version web (Sentry). Sans DSN, ou hors web, ne fait rien.
 * Ne doit JAMAIS faire echouer l'application : tout est dans un try/catch.
 */
export function initSentry() {
  try {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || SENTRY_DSN;
    if (!dsn || Platform.OS !== 'web') return;
    const Sentry = require('@sentry/browser');
    Sentry.init({ dsn, environment: 'production', sendDefaultPii: false, tracesSampleRate: 0 });
  } catch (e) {
    // volontairement ignore
  }
}
