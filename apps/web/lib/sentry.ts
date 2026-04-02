type SentryInit = (opts: {
  dsn: string;
  tracesSampleRate: number;
  environment: string | undefined;
}) => void;

export function initSentry() {
  if (typeof window === 'undefined') return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  // Dynamic import via eval to avoid TypeScript static module resolution failure
  // when @sentry/nextjs is not installed. Safe: only runs client-side with a valid DSN.
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<{ init: SentryInit }>;
  dynamicImport('@sentry/nextjs')
    .then(({ init }) => {
      init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
    })
    .catch(() => {});
}
