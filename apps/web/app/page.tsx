import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vexo — Design. Simulate. Stress-test.',
  description: 'The first platform that lets you simulate distributed systems in real time. 92 components, live load simulation, anti-pattern detection.',
  openGraph: {
    title: 'Vexo — Visual System Design & Live Load Simulation',
    description: 'Design, simulate, and stress-test distributed systems in your browser. No login required.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Vexo', description: 'Design. Simulate. Stress-test distributed systems.' },
};

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: '#050507', color: '#E8E6E3', minHeight: '100vh', fontFamily: 'var(--font-space-grotesk, system-ui)' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, backgroundColor: 'rgba(5,5,7,0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.04em', color: '#F5F3F0' }}>Vexo</span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/terms" style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/canvas" style={{ backgroundColor: '#C4F042', color: '#050507', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '120px 24px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(196,240,66,0.1)', border: '1px solid rgba(196,240,66,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#C4F042', marginBottom: 28, fontFamily: 'var(--font-ibm-plex-mono, monospace)' }}>
          No login required · Runs in your browser
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#F5F3F0', margin: '0 0 24px' }}>
          Design. Simulate.<br />
          <span style={{ color: '#C4F042' }}>Stress-test.</span>
        </h1>
        <p style={{ fontSize: 20, color: 'rgba(232,230,227,0.6)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 40px', fontWeight: 400 }}>
          The first platform that lets you simulate distributed systems in real time — 92 components, live load propagation, and anti-pattern detection built in.
        </p>
        <Link
          href="/canvas"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#C4F042', color: '#050507', fontSize: 16, fontWeight: 600, padding: '14px 32px', borderRadius: 10, textDecoration: 'none', letterSpacing: '-0.01em' }}
        >
          Start Building — No Login Required
        </Link>
        <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(232,230,227,0.3)', fontFamily: 'var(--font-ibm-plex-mono, monospace)' }}>
          Everything saves locally. Your designs are yours.
        </p>
      </section>

      {/* Features */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 48, color: '#F5F3F0' }}>
          Built for engineers who think in systems
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: '⚡', title: 'Live Load Simulation', body: 'Drag a QPS slider and watch nodes turn amber and red as saturation builds. See bottlenecks before they hit production.' },
            { icon: '🗂️', title: '92 Components', body: 'Every service you need: compute, databases, storage, networking, messaging, security, observability, AI/ML, and edge.' },
            { icon: '🔗', title: 'Connection Intelligence', body: '13 connection types with hard blocks, soft warnings, and context-aware rules. The canvas tells you when something is wrong.' },
            { icon: '🔥', title: '20 Anti-Pattern Detectors', body: 'Catches Client-Direct-DB, SPOF Database, No DLQ, N+1 queries, and 16 more. Auto-fix for the unambiguous ones.' },
            { icon: '💀', title: 'Failure Simulation', body: '8 preset failure scenarios: kill the primary DB, take down an AZ, network partition. See the cascade in real time.' },
            { icon: '🎯', title: 'Interview Mode', body: '10 classic system design challenges with progressive hints and a timer. Practice before the interview.' },
          ].map((f) => (
            <div key={f.title} style={{ backgroundColor: '#0C0C0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '24px 20px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F3F0', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(232,230,227,0.55)', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '60px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16, color: '#F5F3F0' }}>
          Ready to design something real?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(232,230,227,0.5)', marginBottom: 32 }}>No sign-up. No credit card. Just you and your architecture.</p>
        <Link href="/canvas" style={{ display: 'inline-block', backgroundColor: '#C4F042', color: '#050507', fontSize: 15, fontWeight: 600, padding: '13px 28px', borderRadius: 9, textDecoration: 'none' }}>
          Open Vexo Canvas
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(232,230,227,0.4)' }}>Vexo</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/terms" style={{ fontSize: 12, color: 'rgba(232,230,227,0.35)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(232,230,227,0.35)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(232,230,227,0.3)', fontFamily: 'var(--font-ibm-plex-mono, monospace)' }}>Phase 1 — All data stored locally</span>
      </footer>
    </main>
  );
}
