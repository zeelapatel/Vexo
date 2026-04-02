import { track } from './posthog';
import type { InterviewScenario } from '@vexo/types';

export function trackInterviewStarted(scenario: InterviewScenario) {
  track('challenge_started', {
    scenario_id: scenario.id,
    difficulty: scenario.difficulty,
    category: scenario.category,
    company: scenario.company,
    time_limit_min: scenario.timeLimit,
  });
}

export function trackHintRevealed(scenarioId: string, hintIndex: number) {
  track('hint_revealed', { scenario_id: scenarioId, hint_index: hintIndex });
}

export function trackInterviewSubmitted(
  scenarioId: string,
  durationSec: number,
  hintsUsed: number,
  nodeCount: number,
  edgeCount: number,
) {
  track('challenge_submitted', {
    scenario_id: scenarioId,
    duration_sec: durationSec,
    hints_used: hintsUsed,
    node_count: nodeCount,
    edge_count: edgeCount,
  });
}

export function trackInterviewAbandoned(scenarioId: string, durationSec: number) {
  track('challenge_abandoned', { scenario_id: scenarioId, duration_sec: durationSec });
}

export function trackTimeUp(scenarioId: string) {
  track('challenge_time_up', { scenario_id: scenarioId });
}
