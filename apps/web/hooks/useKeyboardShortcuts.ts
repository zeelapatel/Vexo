import { useEffect } from 'react';

export interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = !shortcut.ctrl || (e.ctrlKey || e.metaKey);
        const shiftMatch = !shortcut.shift || e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

export const SHORTCUT_DEFINITIONS = [
  { key: 'z', ctrl: true, description: 'Undo' },
  { key: 'z', ctrl: true, shift: true, description: 'Redo' },
  { key: 's', ctrl: true, description: 'Save version' },
  { key: 'n', ctrl: true, description: 'New design' },
  { key: 'f', ctrl: true, description: 'Search components' },
  { key: 'Delete', description: 'Delete selected' },
  { key: 'Backspace', description: 'Delete selected' },
  { key: 'Escape', description: 'Deselect / close panel' },
  { key: '?', description: 'Show keyboard shortcuts' },
] as const;
