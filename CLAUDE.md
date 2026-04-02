# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vexo is a Visual System Design & Live Load Simulation Platform — a browser-based tool for designing, simulating, and stress-testing distributed systems without writing infrastructure code. It features a 164-component catalogue, a Component Behaviour Registry (CBR) with cloud-specific simulation models, and a typed connection validation graph.

## Monorepo Structure

Turborepo monorepo with 5 packages (all scoped `@vexo/`):

- **apps/web** — Next.js 15 (App Router, static export via `output: 'export'`). The main UI: canvas, sidebar, toolbar, property panels, simulation bar.
- **packages/engine** — Simulation engine. Processes load models, propagates traffic through the architecture graph, calculates metrics (latency, throughput, error rates).
- **packages/cbr** — Component Behaviour Registry. Contains all 164 component definitions, their properties, default values, and cloud-specific behaviour models (cold starts, throttling, failover windows).
- **packages/types** — Shared TypeScript types across all packages.
- **packages/ui** — Shared UI components built on Radix UI primitives + Lucide icons.

## Build & Dev Commands

```bash
turbo dev          # Start Next.js dev server at localhost:3000
turbo build        # Build all packages
turbo lint         # ESLint across all packages
turbo test         # Vitest unit tests (engine + cbr packages)
```

## Tech Stack

- **Framework**: Next.js 15, App Router, static export (no server in Phase 1)
- **Canvas**: React Flow (node-based graph editor)
- **State**: Zustand (single store with slices)
- **Styling**: Tailwind CSS 4.x, dark-only theme
- **UI Primitives**: Radix UI (Dialog, DropdownMenu, Tabs, Tooltip, Slider, ScrollArea, Popover, ContextMenu, Separator)
- **Icons**: Lucide React
- **Fonts**: Space Grotesk (sans), IBM Plex Mono (mono), Instrument Serif (serif)
- **Testing**: Vitest
- **Formatting**: Prettier (semi: true, singleQuote: true, trailingComma: 'all', printWidth: 100, tabWidth: 2)
- **Deployment**: Vercel (static)

## Design System

Dark-only theme. Key tokens:
- Background: `#050507` (vexo-black), surfaces: surface-1 through surface-hover
- Text: `#E8E6E3` (white), `#F5F3F0` (white-bright), muted, dim variants
- Accent: `#C4F042` (lime green) — used for CTAs, simulation active states
- Signals: red, amber, blue, purple (each with dim variants)
- Borders: `rgba(255,255,255,0.05)` default, `0.12` hover, `0.08` emphasis
- Canvas background: dot grid pattern at 20px intervals
- All text uses `font-sans` (Space Grotesk) except data/metric values which use `font-mono` (IBM Plex Mono)

## Architecture Layers (Build Order)

The codebase follows a strict layered dependency:

1. **Skeleton** — Monorepo, Next.js config, Tailwind theme, Radix UI, layout shell, Vercel deploy, ESLint/Prettier, Vitest
2. **Canvas Core** — React Flow integration, custom node rendering, edge/connection system, drag-and-drop from sidebar, selection, context menus
3. **CBR & Property Panels** — Component type registry, property schemas, right-side property panel (320px overlay), per-component configuration forms
4. **State Management** — Zustand store with slices for canvas, simulation, and UI state. Undo/redo history.
5. **Simulation Engine** — Load model propagation, throughput/latency calculation, bottleneck detection, failure injection, metric computation
6. **Validation & Anti-Patterns** — Connection validation graph (hard blocks, soft warnings, contextual rules), anti-pattern detection engine
7. **Launch Prep** — Polish, onboarding, performance optimization, error boundaries

## Key Design Decisions

- **Generic-first components**: Sidebar shows only generic types (e.g., "Load Balancer", "Message Queue"). Users swap to cloud variants (AWS/GCP/Azure) via the property panel. Swap preserves connections unless architecturally invalid.
- **Simulation is a model, not reality**: All metrics are labelled as estimates. Every metric traces to an inspectable formula.
- **Connection intelligence**: Not a free-draw tool. Connections are validated — invalid ones are blocked or flagged. 13 connection types with hard/soft/contextual rules.
- **No auth in Phase 1**: No login, no server. Everything runs client-side with static export.
- **Speed is critical**: A slow canvas kills the product. Performance is a top priority.

## Planning Documents

- `.doc/Vexo_PRD.md` — Full PRD v2.0 with component catalogue (164 components across 13 categories), behaviour registry spec, and connection validation rules
- `.doc/vexo_phase_1.md` — Phase 1 implementation plan with 76 sequential tasks in strict dependency order
