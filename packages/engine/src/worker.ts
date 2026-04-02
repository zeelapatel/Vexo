import type { WorkerMessage } from './protocol';
import { simulate } from './simulate';
import { getAllComponents } from '@vexo/cbr';
import type { CBREntry } from '@vexo/types';

// Build CBR registry once at worker init
const cbrRegistry = new Map<string, CBREntry>(
  getAllComponents().map((c) => [c.id, c]),
);

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'simulate') {
    try {
      const response = simulate(msg.nodes, msg.edges, msg.entryQPS, cbrRegistry);
      self.postMessage(response);
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) });
    }
  }
});
