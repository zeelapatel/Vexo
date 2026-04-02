import type { VexoNode, VexoEdge, InterviewScenario } from '@vexo/types';
import { ComponentCategory } from '@vexo/types';
import type { CategoryScore } from './types';

/**
 * Evaluates whether the user's canvas addresses the scenario's functional requirements.
 * Uses heuristic component-type matching — not exact component ID matching.
 */
export function evaluateCompleteness(
  nodes: VexoNode[],
  _edges: VexoEdge[],
  scenario: InterviewScenario,
): CategoryScore {
  const weight = scenario.rubric.categories.find((c) => c.key === 'completeness')?.weight ?? 0.25;

  const categories = new Set(nodes.map((n) => n.data.category));
  const componentIds = new Set(nodes.map((n) => n.data.componentId));
  const hasCompute = categories.has(ComponentCategory.Compute);
  const hasDatabase = categories.has(ComponentCategory.Database);
  const hasStorage = categories.has(ComponentCategory.Storage);
  const hasNetworking = categories.has(ComponentCategory.Networking);
  const hasMessaging = categories.has(ComponentCategory.Messaging);
  const hasCache = componentIds.has('generic_redis') || componentIds.has('generic_cache') || componentIds.has('generic_memcached');
  const hasQueue = categories.has(ComponentCategory.Messaging);
  const hasCDN = componentIds.has('generic_cdn');
  const hasAuth = categories.has(ComponentCategory.Security);
  const hasSearch = componentIds.has('generic_elasticsearch');

  const requirements = scenario.requirements;
  if (requirements.length === 0) {
    return buildCategory(weight, 100, [], [], ['No requirements defined — design is unconstrained.']);
  }

  const scores: number[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const req of requirements) {
    const lower = req.toLowerCase();
    let score = 0;

    // Heuristic matching by keyword
    if (matchesCompute(lower, hasCompute)) score += 40;
    if (matchesDatabase(lower, hasDatabase)) score += 30;
    if (matchesCache(lower, hasCache)) score += 20;
    if (matchesMessaging(lower, hasQueue)) score += 20;
    if (matchesStorage(lower, hasStorage)) score += 20;
    if (matchesCDN(lower, hasCDN)) score += 10;
    if (matchesNetworking(lower, hasNetworking)) score += 10;
    if (matchesAuth(lower, hasAuth)) score += 10;
    if (matchesSearch(lower, hasSearch)) score += 10;

    const reqScore = Math.min(100, score);
    scores.push(reqScore);

    if (reqScore >= 70) {
      strengths.push(`Requirement addressed: "${req.slice(0, 60)}${req.length > 60 ? '…' : ''}"`);
    } else if (reqScore < 40) {
      const truncated = req.length > 70 ? req.slice(0, 70) + '…' : req;
      weaknesses.push(`Missing components for: "${truncated}"`);
    }
  }

  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Bonus for exceeding minimum viable design
  const bonus = nodes.length >= 5 ? 5 : 0;
  const finalScore = Math.min(100, avgScore + bonus);

  return buildCategory(weight, finalScore, strengths, weaknesses, [
    `Your design addresses ${scores.filter((s) => s >= 70).length}/${requirements.length} requirements fully.`,
    nodes.length < 3
      ? 'Add more components to address all functional requirements.'
      : 'Good component coverage overall.',
  ]);
}

function matchesCompute(req: string, has: boolean): boolean {
  const keywords = ['user', 'request', 'api', 'service', 'process', 'handle', 'serve', 'upload', 'download', 'redirect', 'deliver'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesDatabase(req: string, has: boolean): boolean {
  const keywords = ['store', 'persist', 'save', 'retrieve', 'history', 'record', 'data', 'status', 'track'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesCache(req: string, has: boolean): boolean {
  const keywords = ['fast', 'latency', 'ms', 'second', 'cache', 'quick', '< 1', '< 5', '< 10', 'real-time'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesMessaging(req: string, has: boolean): boolean {
  const keywords = ['async', 'queue', 'event', 'message', 'notification', 'decouple', 'stream', 'pipeline'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesStorage(req: string, has: boolean): boolean {
  const keywords = ['file', 'image', 'video', 'upload', 'download', 'blob', 'object', 'attachment', 'asset'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesCDN(req: string, has: boolean): boolean {
  const keywords = ['cdn', 'edge', 'globally', 'global', 'worldwide', 'serve static', 'latency'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesNetworking(req: string, has: boolean): boolean {
  const keywords = ['route', 'load balanc', 'api gateway', 'proxy', 'multiple instance', 'scale'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesAuth(req: string, has: boolean): boolean {
  const keywords = ['auth', 'login', 'token', 'secure', 'permission', 'access control'];
  return has && keywords.some((k) => req.includes(k));
}

function matchesSearch(req: string, has: boolean): boolean {
  const keywords = ['search', 'query', 'full-text', 'filter', 'find'];
  return has && keywords.some((k) => req.includes(k));
}

function buildCategory(
  weight: number,
  score: number,
  strengths: string[],
  weaknesses: string[],
  suggestions: string[],
): CategoryScore {
  return {
    key: 'completeness',
    name: 'Completeness',
    score,
    weight,
    weightedScore: Math.round(score * weight),
    feedback: weaknesses.length === 0
      ? 'All functional requirements appear to be addressed by your design.'
      : `${weaknesses.length} requirement(s) may not be fully addressed. Review missing components.`,
    criteriaResults: [{
      id: 'req_coverage',
      description: 'Functional requirements coverage',
      score,
      maxPoints: 100,
      feedback: suggestions.join(' '),
    }],
  };
}
