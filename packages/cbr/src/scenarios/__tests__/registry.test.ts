import { describe, it, expect } from 'vitest';
import {
  getAllScenarios,
  getScenarioById,
  getScenariosByDifficulty,
  getScenariosByCategory,
  getScenariosByCompany,
  searchScenarios,
  getScenarioCountByDifficulty,
  getGenericScenarios,
} from '../registry';

describe('Scenario Registry', () => {
  it('contains exactly 52 scenarios', () => {
    expect(getAllScenarios()).toHaveLength(52);
  });

  it('contains 15 beginner scenarios', () => {
    expect(getScenariosByDifficulty('beginner')).toHaveLength(15);
  });

  it('contains 15 intermediate scenarios', () => {
    expect(getScenariosByDifficulty('intermediate')).toHaveLength(15);
  });

  it('contains 12 advanced scenarios', () => {
    expect(getScenariosByDifficulty('advanced')).toHaveLength(12);
  });

  it('contains 10 expert/company scenarios', () => {
    expect(getScenariosByDifficulty('expert')).toHaveLength(10);
  });

  it('all scenario IDs are unique', () => {
    const ids = getAllScenarios().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all rubric weights sum to 1.0 per scenario', () => {
    for (const scenario of getAllScenarios()) {
      const total = scenario.rubric.categories.reduce((sum, c) => sum + c.weight, 0);
      expect(total).toBeCloseTo(1.0, 5);
    }
  });

  it('all scenarios have at least 1 requirement', () => {
    for (const scenario of getAllScenarios()) {
      expect(scenario.requirements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all scenarios have at least 1 hint', () => {
    for (const scenario of getAllScenarios()) {
      expect(scenario.hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all scenarios have a reference solution with at least 1 node', () => {
    for (const scenario of getAllScenarios()) {
      expect(scenario.referenceSolution.nodes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all scenarios have a positive timeLimit', () => {
    for (const scenario of getAllScenarios()) {
      expect(scenario.timeLimit).toBeGreaterThan(0);
    }
  });

  it('getScenarioById returns the correct scenario', () => {
    const scenario = getScenarioById('url-shortener');
    expect(scenario).toBeDefined();
    expect(scenario!.title).toBe('URL Shortener');
  });

  it('getScenarioById returns undefined for unknown id', () => {
    expect(getScenarioById('nonexistent-id')).toBeUndefined();
  });

  it('getScenariosByCompany returns only netflix scenarios', () => {
    const scenarios = getScenariosByCompany('netflix');
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.every((s) => s.company === 'netflix')).toBe(true);
  });

  it('getGenericScenarios returns only null-company scenarios', () => {
    const generics = getGenericScenarios();
    expect(generics.every((s) => s.company === null)).toBe(true);
    expect(generics.length).toBe(42); // 15 + 15 + 12
  });

  it('searchScenarios finds "video streaming" in netflix scenario', () => {
    const results = searchScenarios('video streaming');
    expect(results.length).toBeGreaterThan(0);
  });

  it('searchScenarios returns empty query as all scenarios', () => {
    expect(searchScenarios('')).toHaveLength(52);
  });

  it('searchScenarios finds redis scenarios', () => {
    const results = searchScenarios('redis');
    expect(results.length).toBeGreaterThan(0);
  });

  it('getScenarioCountByDifficulty sums to 52', () => {
    const counts = getScenarioCountByDifficulty();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(52);
  });

  it('all scenarios have at least 1 nonFunctionalRequirement', () => {
    for (const scenario of getAllScenarios()) {
      expect(scenario.nonFunctionalRequirements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all referenceSolution edges have valid source and target node ids', () => {
    for (const scenario of getAllScenarios()) {
      const nodeIds = new Set(scenario.referenceSolution.nodes.map((n) => n.id));
      for (const edge of scenario.referenceSolution.edges) {
        expect(nodeIds.has(edge.source), `${scenario.id}: edge ${edge.id} source '${edge.source}' not in nodes`).toBe(true);
        expect(nodeIds.has(edge.target), `${scenario.id}: edge ${edge.id} target '${edge.target}' not in nodes`).toBe(true);
      }
    }
  });
});
