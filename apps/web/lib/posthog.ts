'use client';

type PostHogLike = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  init: (key: string, opts: Record<string, unknown>) => void;
};

let posthog: { capture?: (event: string, props?: Record<string, unknown>) => void } = {};

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (navigator.doNotTrack === '1') return;
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  // Dynamic import via eval to avoid TypeScript static module resolution failure
  // when posthog-js is not installed. Safe: only runs client-side with a valid key.
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<{ default: PostHogLike }>;
  dynamicImport('posthog-js')
    .then(({ default: ph }) => {
      ph.init(apiKey, { api_host: 'https://app.posthog.com', autocapture: false });
      posthog = ph;
    })
    .catch(() => {});
}

export function track(event: string, props?: Record<string, unknown>) {
  posthog.capture?.(event, props);
}
