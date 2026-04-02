# Vexo

**Visual System Design & Live Load Simulation Platform**

Design, simulate, and stress-test distributed systems in your browser. No login required.

## What is Vexo?

Vexo is a browser-based tool for designing, simulating, and stress-testing distributed systems without writing infrastructure code. Drop components onto a canvas, connect them, and watch your architecture respond to live load in real time.

### Features

- **92-component catalogue** — Compute, databases, storage, networking, messaging, security, observability, AI/ML, and edge
- **Live load simulation** — Drag a QPS slider and see nodes turn amber and red as saturation builds
- **Connection intelligence** — 13 connection types with hard blocks, soft warnings, and context rules
- **20 anti-pattern detectors** — Client-Direct-DB, SPOF, N+1, no DLQ, and 16 more
- **8 failure scenarios** — Kill the database, take down an AZ, simulate a network partition
- **Interview mode** — 10 classic system design challenges with progressive hints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, App Router, static export |
| Canvas | React Flow (xyflow v12) |
| State | Zustand + Immer + zundo (undo/redo) |
| Styling | Tailwind CSS 4.x, dark-only theme |
| UI Primitives | Radix UI |
| Icons | Lucide React |
| Fonts | Space Grotesk, IBM Plex Mono, Instrument Serif |
| Testing | Vitest |
| Build | Turborepo |
| Deployment | Vercel (static) |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-org/vexo.git
cd vexo

# Install dependencies
npm install

# Start the dev server
npx turbo dev
# App available at http://localhost:3000
```

## Monorepo Structure

```
vexo/
├── apps/
│   └── web/              # Next.js app (canvas, UI, panels)
├── packages/
│   ├── engine/           # Simulation engine, validation, anti-patterns
│   ├── cbr/              # Component Behaviour Registry (92 components)
│   ├── types/            # Shared TypeScript types
│   └── ui/               # Shared UI components + icon library
```

## Scripts

```bash
npx turbo dev       # Start dev server
npx turbo build     # Build all packages
npx turbo test      # Run Vitest across engine + cbr
npx turbo lint      # ESLint all packages
```

## Architecture

Vexo is organized into 7 layers built in strict dependency order:

1. **Skeleton** — Monorepo, Next.js, Tailwind theme, Vercel deploy
2. **Canvas Core** — React Flow, custom nodes/edges, sidebar drag-drop
3. **CBR & Property Panels** — 92 component definitions, property panel
4. **State Management** — Zustand store, persistence, undo/redo, multi-design
5. **Simulation Engine** — Load propagation, saturation calculator, bottleneck detection
6. **Validation** — 21 connection rules, 20 anti-pattern detectors
7. **Launch Prep** — Version history, interview mode, export, landing page

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes
4. Open a pull request

Please follow the existing code style (Prettier + ESLint are enforced in CI).

## License

MIT
