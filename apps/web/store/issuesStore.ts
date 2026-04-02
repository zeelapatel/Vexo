import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Issue {
  id: string;
  type: 'connection_warning' | 'antipattern';
  severity: 'warning' | 'critical';
  title: string;
  body: string;
  suggestedFix?: string;
  affectedNodeIds?: string[];
  affectedEdgeIds?: string[];
  dismissed: boolean;
  autoFixAvailable?: boolean;
  autoFixPatternId?: string;
}

interface IssuesState {
  issues: Issue[];
  focusedIssueId: string | null;
}

interface IssuesActions {
  setIssues: (issues: Omit<Issue, 'dismissed'>[]) => void;
  dismissIssue: (id: string) => void;
  clearConnectionWarnings: () => void;
  setFocusedIssue: (id: string | null) => void;
}

export type IssuesStore = IssuesState & IssuesActions;

// Returns the focused Issue object (or null). Run once at a parent level
// instead of once per node/edge to avoid N linear searches.
export const selectFocusedIssue = (s: IssuesStore) =>
  s.focusedIssueId ? (s.issues.find((i) => i.id === s.focusedIssueId) ?? null) : null;

export const useIssuesStore = create<IssuesStore>()(
  immer((set) => ({
    issues: [],
    focusedIssueId: null,

    setIssues: (newIssues) =>
      set((state) => {
        const dismissedIds = new Set(
          state.issues.filter((i) => i.dismissed).map((i) => i.id),
        );
        state.issues = newIssues.map((i) => ({
          ...i,
          dismissed: dismissedIds.has(i.id),
        }));
        // Clear focus if focused issue was removed by a rescan
        if (state.focusedIssueId && !newIssues.some((i) => i.id === state.focusedIssueId)) {
          state.focusedIssueId = null;
        }
      }),

    dismissIssue: (id) =>
      set((state) => {
        const issue = state.issues.find((i) => i.id === id);
        if (issue) issue.dismissed = true;
        // Auto-clear focus when the focused issue is dismissed
        if (state.focusedIssueId === id) state.focusedIssueId = null;
      }),

    clearConnectionWarnings: () =>
      set((state) => {
        state.issues = state.issues.filter((i) => i.type !== 'connection_warning');
      }),

    setFocusedIssue: (id) =>
      set((state) => {
        state.focusedIssueId = id;
      }),
  })),
);
