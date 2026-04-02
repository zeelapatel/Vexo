import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy Policy — Vexo', description: 'Vexo Privacy Policy' };

export default function PrivacyPage() {
  return (
    <main style={{ backgroundColor: '#050507', color: '#E8E6E3', minHeight: '100vh', padding: '60px 24px', fontFamily: 'var(--font-space-grotesk, system-ui)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: '#C4F042', textDecoration: 'none', display: 'block', marginBottom: 32 }}>← Back to Vexo</Link>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8, color: '#F5F3F0' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'rgba(232,230,227,0.4)', fontFamily: 'var(--font-ibm-plex-mono, monospace)', marginBottom: 48 }}>Last updated: April 2026</p>
        {[
          { title: '1. Data We Collect (Phase 1)', body: "In Phase 1, Vexo stores all data locally in your browser's localStorage. We do not collect, transmit, or store any personal data on our servers. Your architecture designs, settings, and preferences never leave your device." },
          { title: '2. Cookies', body: 'Vexo does not use cookies in Phase 1. No tracking cookies, no session cookies, no third-party cookies.' },
          { title: '3. Analytics', body: 'We may integrate PostHog for anonymous product analytics (page views, feature usage counts). PostHog is configured to not collect personal identifiers. We may integrate Sentry for error tracking, which collects browser type and error stack traces — no personal data.' },
          { title: '4. Third-Party Services', body: 'Phase 1 uses: Vercel for hosting (see Vercel Privacy Policy), Cloudflare for DNS (see Cloudflare Privacy Policy). No other third-party services with data access.' },
          { title: '5. Phase 2 Notice', body: 'Phase 2 will introduce optional account creation and cloud sync. At that point, this policy will be updated to describe server-side data collection, retention, and your rights. You will be notified before any data collection begins.' },
          { title: '6. Data Retention', body: "All localStorage data persists until you clear your browser data. We have no control over or access to this data." },
          { title: '7. Your Rights', body: "Since we collect no personal data in Phase 1, there is nothing to request, correct, or delete on our end. To remove your Vexo data, clear your browser's localStorage for this domain." },
          { title: '8. Contact', body: 'Privacy questions: open an issue on our GitHub repository.' },
        ].map((s) => (
          <section key={s.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F5F3F0', marginBottom: 12 }}>{s.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(232,230,227,0.7)', margin: 0 }}>{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
