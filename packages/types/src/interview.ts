import { VexoNode } from './node';
import { VexoEdge } from './edge';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ScenarioCategory =
  | 'databases'
  | 'caching'
  | 'messaging'
  | 'real-time'
  | 'storage'
  | 'search'
  | 'social'
  | 'e-commerce'
  | 'streaming'
  | 'infrastructure';

export type Company = 'netflix' | 'uber' | 'stripe' | 'google' | 'meta' | null;

export interface RubricCriterion {
  id: string;
  description: string;
  maxPoints: number;
  evaluationGuide: string;
}

export interface RubricCategory {
  key: string;
  name: string;
  /** Weight as a decimal. All weights in a rubric must sum to 1.0. */
  weight: number;
  criteria: RubricCriterion[];
}

export interface ScoringRubric {
  categories: RubricCategory[];
}

export interface StarterCanvas {
  nodes: VexoNode[];
  edges: VexoEdge[];
}

export interface ReferenceSolution {
  nodes: VexoNode[];
  edges: VexoEdge[];
  /** Markdown explanation of the solution, structured in sections. */
  explanation: string;
}

export interface InterviewScenario {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: ScenarioCategory;
  /** null for generic scenarios, set for company-specific packs */
  company: Company;
  /** Time limit in minutes */
  timeLimit: number;
  requirements: string[];
  nonFunctionalRequirements: string[];
  constraints: string[];
  /** Progressive hints — reveal one at a time. Each hint used = -5 pts. */
  hints: string[];
  starterCanvas: StarterCanvas;
  referenceSolution: ReferenceSolution;
  rubric: ScoringRubric;
}

// ── Default Rubric ────────────────────────────────────────────────────────────
// Standard weights (sum = 1.0). Scenarios may override.
export const DEFAULT_RUBRIC: ScoringRubric = {
  categories: [
    {
      key: 'completeness',
      name: 'Completeness',
      weight: 0.25,
      criteria: [
        {
          id: 'req_coverage',
          description: 'All functional requirements are addressed by components in the design',
          maxPoints: 100,
          evaluationGuide:
            'Check each requirement against canvas components. Score 100 if fully addressed, 50 if partially, 0 if missing.',
        },
      ],
    },
    {
      key: 'scalability',
      name: 'Scalability',
      weight: 0.25,
      criteria: [
        {
          id: 'nfr_load',
          description: 'Design handles NFR target load without critical bottlenecks',
          maxPoints: 100,
          evaluationGuide:
            'Simulate at NFR target QPS. Check if any bottleneck node saturation exceeds 90%.',
        },
      ],
    },
    {
      key: 'availability',
      name: 'High Availability',
      weight: 0.2,
      criteria: [
        {
          id: 'spof',
          description: 'No single points of failure on the critical path',
          maxPoints: 100,
          evaluationGuide:
            'Inject kill_primary_db and kill_cache failures. Score low if system goes critical or loses all paths.',
        },
      ],
    },
    {
      key: 'data_model',
      name: 'Data Model',
      weight: 0.15,
      criteria: [
        {
          id: 'db_choice',
          description: 'Appropriate data store types chosen for the access patterns',
          maxPoints: 100,
          evaluationGuide:
            'Check relational for structured data, NoSQL for flexible/high-write, cache for read-heavy, search for full-text.',
        },
      ],
    },
    {
      key: 'tradeoffs',
      name: 'Trade-off Awareness',
      weight: 0.15,
      criteria: [
        {
          id: 'complexity',
          description: 'Design complexity is appropriate for the problem scope',
          maxPoints: 100,
          evaluationGuide:
            'Penalise over-engineering (>20 components for beginner) and under-engineering (<5 for advanced). Check pattern consistency.',
        },
      ],
    },
  ],
};

// ── Beginner rubric (slightly adjusted weights) ───────────────────────────────
export const BEGINNER_RUBRIC: ScoringRubric = {
  categories: DEFAULT_RUBRIC.categories.map((cat) => {
    const overrides: Record<string, number> = {
      completeness: 0.3,
      scalability: 0.2,
      availability: 0.2,
      data_model: 0.2,
      tradeoffs: 0.1,
    };
    return { ...cat, weight: overrides[cat.key] ?? cat.weight };
  }),
};
