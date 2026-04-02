import type { VexoNode, VexoEdge, InterviewScenario } from '@vexo/types';
import { ComponentCategory } from '@vexo/types';
import type { CategoryScore } from './types';

/**
 * Evaluates whether the user chose appropriate data stores for the access patterns.
 * Pure graph/component analysis — no simulation needed.
 */
export function evaluateDataModel(
  nodes: VexoNode[],
  edges: VexoEdge[],
  scenario: InterviewScenario,
): CategoryScore {
  const weight = scenario.rubric.categories.find((c) => c.key === 'data_model')?.weight ?? 0.15;

  if (nodes.length === 0) {
    return buildCategory(weight, 0, 'No components to evaluate.', [], ['Add data store components.']);
  }

  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const dbNodes = nodes.filter((n) => n.data.category === ComponentCategory.Database);
  const storageNodes = nodes.filter((n) => n.data.category === ComponentCategory.Storage);
  const hasSql = dbNodes.some((n) => n.data.componentId.includes('postgresql') || n.data.componentId.includes('mysql'));
  const hasNoSql = dbNodes.some((n) => n.data.componentId.includes('mongodb') || n.data.componentId.includes('cassandra'));
  const hasCache = dbNodes.some((n) => n.data.componentId.includes('redis') || n.data.componentId.includes('cache'));
  const hasSearch = dbNodes.some((n) => n.data.componentId.includes('elasticsearch'));
  const hasTimeSeries = dbNodes.some((n) => n.data.componentId.includes('data_warehouse') || n.data.componentId.includes('timeseries'));
  const hasObjectStorage = storageNodes.some((n) => n.data.componentId.includes('object_storage'));

  const scenarioCategory = scenario.category;
  const desc = (scenario.description + ' ' + scenario.requirements.join(' ')).toLowerCase();

  // ── Appropriateness checks ────────────────────────────────────────────────

  // No data stores at all
  if (dbNodes.length === 0 && storageNodes.length === 0) {
    score -= 30;
    weaknesses.push('No data store detected. Almost all systems require persistent storage.');
    return buildCategory(weight, Math.max(0, score), '', [], weaknesses);
  }

  // SQL-only for high write-throughput scenarios
  const isHighWriteThroughput = /\b(million|1m|10m|100m|1b)\b.*(write|post|message|event|log)/i.test(desc);
  if (hasSql && !hasNoSql && !hasCache && isHighWriteThroughput) {
    score -= 15;
    weaknesses.push(
      'Using only a relational DB for a high write-throughput workload may cause bottlenecks. Consider a NoSQL store or write-through cache.',
    );
  }

  // Cache for read-heavy scenarios
  const isReadHeavy = /(\d+)x?\s*read/.test(desc) || /read.*write/i.test(desc) || ['caching', 'search', 'e-commerce', 'social'].includes(scenarioCategory);
  if (isReadHeavy && hasCache) {
    score += 15;
    strengths.push('Cache layer reduces read load on the primary database — appropriate for read-heavy workloads.');
  } else if (isReadHeavy && !hasCache) {
    score -= 10;
    weaknesses.push('Read-heavy workload without a cache layer — database will be overloaded at scale.');
  }

  // Search engine for search scenarios
  if ((scenarioCategory === 'search' || desc.includes('full-text search') || desc.includes('searchable')) && !hasSearch) {
    score -= 10;
    weaknesses.push('Search functionality without a search engine (Elasticsearch). Full-text search in SQL is slow at scale.');
  } else if (hasSearch) {
    score += 10;
    strengths.push('Elasticsearch handles full-text search efficiently with inverted indexes.');
  }

  // Object storage for file/video/image scenarios
  const isFileHeavy = ['storage', 'streaming'].includes(scenarioCategory) || /\b(file|video|image|blob|upload)\b/.test(desc);
  if (isFileHeavy && !hasObjectStorage) {
    score -= 10;
    weaknesses.push('File/media workload without object storage. Storing binaries in a relational DB is expensive and slow.');
  } else if (isFileHeavy && hasObjectStorage) {
    score += 10;
    strengths.push('Object storage is the right choice for large binaries — cost-effective and highly durable.');
  }

  // Polyglot persistence bonus
  const distinctStoreTypes = [hasSql, hasNoSql, hasCache, hasSearch, hasObjectStorage, hasTimeSeries].filter(Boolean).length;
  if (distinctStoreTypes >= 3) {
    score += 10;
    strengths.push('Polyglot persistence — using the right data store for each access pattern.');
  }

  // CQRS / read-replica pattern
  const hasReadReplica = edges.some((e) => e.data?.connectionType === 'DB_REPLICATION');
  if (hasReadReplica) {
    score += 5;
    strengths.push('Read replica/replication pattern detected — separates read and write paths.');
  }

  // SQL only for simple scenarios (positive signal)
  const isSimple = scenario.difficulty === 'beginner' && !isHighWriteThroughput;
  if (isSimple && hasSql && !hasNoSql) {
    score += 5;
    strengths.push('Relational DB is appropriate for structured data with clear relationships at beginner scale.');
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return buildCategory(
    weight,
    finalScore,
    finalScore >= 70 ? 'Good data store selection for the access patterns.' : 'Data store choices may not match access patterns.',
    strengths,
    weaknesses,
  );
}

function buildCategory(
  weight: number,
  score: number,
  feedback: string,
  strengths: string[],
  weaknesses: string[],
): CategoryScore {
  return {
    key: 'data_model',
    name: 'Data Model',
    score,
    weight,
    weightedScore: Math.round(score * weight),
    feedback,
    criteriaResults: [{
      id: 'db_choice',
      description: 'Appropriate data store types for access patterns',
      score,
      maxPoints: 100,
      feedback: [...strengths, ...weaknesses].join(' '),
    }],
  };
}
