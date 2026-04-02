import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms of Service — Vexo', description: 'Vexo Terms of Service' };

export default function TermsPage() {
  return (
    <main style={{ backgroundColor: '#050507', color: '#E8E6E3', minHeight: '100vh', padding: '60px 24px', fontFamily: 'var(--font-space-grotesk, system-ui)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: '#C4F042', textDecoration: 'none', display: 'block', marginBottom: 32 }}>← Back to Vexo</Link>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8, color: '#F5F3F0' }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: 'rgba(232,230,227,0.4)', fontFamily: 'var(--font-ibm-plex-mono, monospace)', marginBottom: 48 }}>Last updated: April 2026</p>
        {[
          { title: '1. Acceptance', body: 'By using Vexo, you agree to these Terms. If you do not agree, do not use the service.' },
          { title: '2. Your Content', body: 'Architecture designs you create using Vexo belong entirely to you. We claim no ownership over user-generated designs. All canvas data is stored locally in your browser and never transmitted to our servers in Phase 1.' },
          { title: '3. Intellectual Property', body: 'The Vexo platform, including the Component Behaviour Registry (CBR), simulation engine, anti-pattern rules, and UI, are owned by Vexo. The CBR data is proprietary and may not be extracted or reproduced.' },
          { title: '4. Simulation Estimates', body: "Vexo's simulation results are estimates only. They are based on generalized models and should not be used as a substitute for actual load testing, capacity planning, or production benchmarking. No simulation tool can fully predict real-world behavior." },
          { title: '5. Acceptable Use', body: "You agree not to use Vexo to design systems intended for illegal purposes, attempt to reverse-engineer the simulation models or CBR data, or interfere with the service's availability." },
          { title: '6. Limitation of Liability', body: 'Vexo is provided "as is" without warranties. We are not liable for any damages arising from use of the service, including losses caused by relying on simulation estimates.' },
          { title: '7. Changes', body: 'We may update these Terms. Continued use after changes constitutes acceptance.' },
          { title: '8. Contact', body: 'For questions about these Terms, open an issue on our GitHub repository.' },
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
