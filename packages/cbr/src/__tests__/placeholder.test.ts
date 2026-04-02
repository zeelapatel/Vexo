import { describe, it, expect } from 'vitest';
import { getAllComponents, getComponent, searchComponents } from '../registry';
import { validateCBREntry } from '../schema';

describe('CBR Registry', () => {
  it('contains at least 70 components', () => {
    const all = getAllComponents();
    expect(all.length).toBeGreaterThanOrEqual(70);
  });

  it('getComponent returns web server', () => {
    const ws = getComponent('generic_web_server');
    expect(ws).toBeDefined();
    expect(ws?.display_name).toBe('Web Server');
  });

  it('searchComponents finds kafka', () => {
    const results = searchComponents('kafka');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id.includes('kafka'))).toBe(true);
  });

  it('all components pass schema validation', () => {
    const all = getAllComponents();
    for (const entry of all) {
      const { valid, errors } = validateCBREntry(entry);
      expect(valid, `${entry.id} failed: ${errors.join(', ')}`).toBe(true);
    }
  });
});
