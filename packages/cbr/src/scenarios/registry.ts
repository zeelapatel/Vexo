import type { InterviewScenario, Difficulty, ScenarioCategory, Company } from '@vexo/types';
import { BEGINNER_SCENARIOS } from './beginner';
import { INTERMEDIATE_SCENARIOS } from './intermediate';
import { ADVANCED_SCENARIOS } from './advanced';
import { COMPANY_SCENARIOS } from './company';

const ALL_SCENARIOS: InterviewScenario[] = [
  ...BEGINNER_SCENARIOS,
  ...INTERMEDIATE_SCENARIOS,
  ...ADVANCED_SCENARIOS,
  ...COMPANY_SCENARIOS,
];

export function getAllScenarios(): InterviewScenario[] {
  return ALL_SCENARIOS;
}

export function getScenarioById(id: string): InterviewScenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByDifficulty(difficulty: Difficulty): InterviewScenario[] {
  return ALL_SCENARIOS.filter((s) => s.difficulty === difficulty);
}

export function getScenariosByCategory(category: ScenarioCategory): InterviewScenario[] {
  return ALL_SCENARIOS.filter((s) => s.category === category);
}

export function getScenariosByCompany(company: Exclude<Company, null>): InterviewScenario[] {
  return ALL_SCENARIOS.filter((s) => s.company === company);
}

export function getGenericScenarios(): InterviewScenario[] {
  return ALL_SCENARIOS.filter((s) => s.company === null);
}

export function searchScenarios(query: string): InterviewScenario[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_SCENARIOS;

  return ALL_SCENARIOS.filter((s) => {
    const haystack = [
      s.title,
      s.description,
      s.category,
      s.company ?? '',
      ...s.requirements,
      ...s.nonFunctionalRequirements,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getScenarioCountByDifficulty(): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0,
  };
  for (const s of ALL_SCENARIOS) {
    counts[s.difficulty]++;
  }
  return counts;
}
