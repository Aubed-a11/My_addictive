import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { SENTRY_DSN } from './sentryConfig';
import './index.css';

// Supervision des erreurs du navigateur (Sentry). Sans DSN, rien n'est envoye.
const dsn = import.meta.env.VITE_SENTRY_DSN || SENTRY_DSN;
if (dsn) {
  try {
    Sentry.init({ dsn, environment: 'production', sendDefaultPii: false, tracesSampleRate: 0 });
  } catch (e) { /* la supervision ne doit jamais casser le dashboard */ }
}

function PageErreur() {
  return <p style={{ padding: 24, fontFamily: 'sans-serif' }}>Une erreur est survenue. Rechargez la page.</p>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<PageErreur />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
