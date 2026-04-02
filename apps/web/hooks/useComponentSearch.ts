import { useMemo } from 'react';
import { SIDEBAR_CATEGORIES, type SidebarComponent } from '@/data/sidebarCategories';

export function useComponentSearch(query: string): SidebarComponent[] | null {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const results: Array<SidebarComponent & { score: number }> = [];

    for (const category of SIDEBAR_CATEGORIES) {
      for (const component of category.components) {
        const labelMatch = component.label.toLowerCase().includes(q);
        const categoryMatch = category.label.toLowerCase().includes(q);
        const idMatch = component.id.toLowerCase().includes(q);
        if (labelMatch || categoryMatch || idMatch) {
          results.push({
            ...component,
            score: labelMatch ? 2 : categoryMatch ? 1 : 0,
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).map(({ score: _score, ...c }) => c);
  }, [query]);
}
