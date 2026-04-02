import type { CBREntry } from '@vexo/types';
import { ComponentCategory } from '@vexo/types';
import { computeComponents } from './compute';
import { databaseComponents } from './databases';
import { storageComponents } from './storage';
import { networkingComponents } from './networking';
import { messagingComponents } from './messaging';
import { securityComponents } from './security';
import { observabilityComponents } from './observability';
import { aimlComponents } from './aiml';
import { clientComponents } from './client';

const ALL_COMPONENTS: CBREntry[] = [
  ...computeComponents,
  ...databaseComponents,
  ...storageComponents,
  ...networkingComponents,
  ...messagingComponents,
  ...securityComponents,
  ...observabilityComponents,
  ...aimlComponents,
  ...clientComponents,
];

const registry = new Map<string, CBREntry>(ALL_COMPONENTS.map((c) => [c.id, c]));

export function getComponent(id: string): CBREntry | undefined {
  return registry.get(id);
}

export function getComponentsByCategory(category: ComponentCategory): CBREntry[] {
  return ALL_COMPONENTS.filter((c) => c.category === category);
}

export function searchComponents(query: string): CBREntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_COMPONENTS;
  return ALL_COMPONENTS.filter(
    (c) =>
      c.display_name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.properties.some((p) => p.label.toLowerCase().includes(q)),
  );
}

export function getAllComponents(): CBREntry[] {
  return ALL_COMPONENTS;
}

export { registry };
