import type { InterviewScenario, VexoNode, VexoEdge } from '@vexo/types';
import { ConnectionType } from '@vexo/types';
import type { PersonalityId } from './personalities';
import { getPersonality } from './personalities';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  canvasSnapshot?: string;
}

/**
 * Builds the complete interviewer system prompt.
 * Called on every message to inject the current canvas state.
 */
export function buildInterviewerPrompt(
  scenario: InterviewScenario,
  nodes: VexoNode[],
  edges: VexoEdge[],
  history: ConversationMessage[],
  personality: PersonalityId = 'friendly',
  previousCanvas?: string,
): string {
  const personalityConfig = getPersonality(personality);
  const canvasState = serializeCanvas(nodes, edges);
  const canvasDelta = previousCanvas ? computeDelta(previousCanvas, canvasState) : null;

  return `You are a senior staff engineer conducting a live system design interview. You are evaluating a candidate's design on an interactive canvas.

## YOUR PERSONA
${personalityConfig.promptModifier}

## THE INTERVIEW CHALLENGE
**Title:** ${scenario.title}
**Difficulty:** ${scenario.difficulty}
${scenario.company ? `**Company:** ${scenario.company}` : ''}

**Problem:**
${scenario.description}

**Functional Requirements:**
${scenario.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**Non-Functional Requirements:**
${scenario.nonFunctionalRequirements.map((r) => `- ${r}`).join('\n')}

**Scoring Rubric (what you are evaluating):**
${scenario.rubric.categories.map((c) => `- ${c.name} (${Math.round(c.weight * 100)}%): ${c.criteria[0]?.evaluationGuide ?? ''}`).join('\n')}

## CANDIDATE'S CURRENT DESIGN
${canvasState}

${canvasDelta ? `## RECENT CHANGES\n${canvasDelta}\n` : ''}

## RULES FOR THE INTERVIEW
1. NEVER give the answer directly. Ask questions that lead the candidate to the answer.
2. Ask ONE question at a time. Never ask multiple questions in a single message.
3. Probe WHY behind every component added. "You added Redis — why Redis over Memcached here?"
4. Challenge SPOFs: "Your database is a single instance. What happens if it goes down?"
5. If the candidate asks "what should I do?", respond with a hint question, not a directive.
6. If the candidate asks "is this right?", probe their reasoning: "What makes you think that?"
7. Stay in character. Do not break the interview format.
8. Keep responses SHORT — 1-3 sentences maximum. This is a conversation, not a lecture.
9. Refer to specific components on their canvas by name.
10. After 30 messages total, wrap up: "We're running short on time. Let's summarise your design."`;
}

/**
 * Serializes canvas nodes and edges into human-readable text for the AI.
 */
export function serializeCanvas(nodes: VexoNode[], edges: VexoEdge[]): string {
  if (nodes.length === 0) return 'Empty canvas — no components added yet.';

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const connections = edges.map((e) => {
    const src = nodeMap.get(e.source)?.data.label ?? e.source;
    const tgt = nodeMap.get(e.target)?.data.label ?? e.target;
    const connType = formatConnectionType(e.data?.connectionType);
    return `[${src}] →${connType}→ [${tgt}]`;
  });

  const nodeList = nodes.map((n) => `${n.data.label} (${n.data.category})`).join(', ');

  return [
    `Components (${nodes.length}): ${nodeList}`,
    connections.length > 0 ? `Connections (${connections.length}): ${connections.join('; ')}` : 'No connections yet.',
  ].join('\n');
}

function formatConnectionType(ct?: string): string {
  const labels: Record<string, string> = {
    [ConnectionType.SYNC_HTTP]: 'HTTP',
    [ConnectionType.SYNC_GRPC]: 'gRPC',
    [ConnectionType.ASYNC_QUEUE]: 'QUEUE',
    [ConnectionType.ASYNC_STREAM]: 'STREAM',
    [ConnectionType.DB_READ]: 'DB_READ',
    [ConnectionType.DB_WRITE]: 'DB_WRITE',
    [ConnectionType.DB_REPLICATION]: 'REPLICATION',
    [ConnectionType.CACHE_READ]: 'CACHE_READ',
    [ConnectionType.CACHE_WRITE]: 'CACHE_WRITE',
    [ConnectionType.CDN_ORIGIN]: 'CDN',
    [ConnectionType.AUTH_CHECK]: 'AUTH',
    [ConnectionType.HEALTH_CHECK]: 'HEALTH',
    [ConnectionType.DNS_RESOLUTION]: 'DNS',
  };
  return ct ? (labels[ct] ?? ct) : '';
}

function computeDelta(prev: string, curr: string): string | null {
  if (prev === curr) return null;
  // Simple diff: find nodes in curr not in prev
  const prevLines = new Set(prev.split('\n'));
  const newLines = curr.split('\n').filter((l) => !prevLines.has(l));
  if (newLines.length === 0) return null;
  return `New changes: ${newLines.join('; ')}`;
}
