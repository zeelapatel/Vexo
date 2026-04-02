import type { ScoreResult } from '@/store/attemptStore';
import type { ConversationMessage } from '@/lib/interviewer/systemPrompt';
import type { InterviewScenario } from '@vexo/types';
import { serializeCanvas } from '@/lib/interviewer/systemPrompt';
import type { VexoNode, VexoEdge } from '@vexo/types';

/**
 * Enhances a rule-based ScoreResult with qualitative AI feedback
 * based on the interview conversation.
 *
 * If the API call fails, returns the original result unchanged.
 */
export async function enhanceScoreWithAI(
  score: ScoreResult,
  nodes: VexoNode[],
  edges: VexoEdge[],
  scenario: InterviewScenario,
  conversation: ConversationMessage[],
): Promise<ScoreResult> {
  if (conversation.length < 4) {
    // Not enough conversation to derive qualitative feedback
    return score;
  }

  const canvasState = serializeCanvas(nodes, edges);
  const conversationSummary = conversation
    .slice(-20) // last 20 messages
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a senior engineering manager reviewing a system design interview.

## The Challenge
${scenario.title}: ${scenario.description}

## Candidate's Final Design
${canvasState}

## Interview Conversation (last 20 messages)
${conversationSummary}

## Rule-Based Scores
${score.categories.map((c) => `- ${c.name}: ${c.score}/100`).join('\n')}
Total: ${score.totalScore}/100

## Your Task
Based on the conversation and design, provide:
1. One specific STRENGTH the candidate demonstrated (communication, reasoning, or architectural insight)
2. One specific WEAKNESS or gap that was apparent in the conversation
3. One concrete SUGGESTION for improvement

Format as JSON: { "strength": "...", "weakness": "...", "suggestion": "..." }
Keep each under 60 words. Reference specific moments or choices from the conversation.
Do NOT change the numerical scores — only add qualitative text.`;

  try {
    const response = await fetch('/api/interviewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'You are a concise engineering interview evaluator. Respond only with valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok || !response.body) return score;

    // Collect streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { type: string; delta?: { text?: string } };
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
            }
          } catch { /* ignore */ }
        }
      }
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return score;

    const ai = JSON.parse(jsonMatch[0]) as { strength?: string; weakness?: string; suggestion?: string };

    return {
      ...score,
      strengths: [...score.strengths, ai.strength ? `[AI] ${ai.strength}` : ''].filter(Boolean),
      weaknesses: [...score.weaknesses, ai.weakness ? `[AI] ${ai.weakness}` : ''].filter(Boolean),
      suggestions: [...score.suggestions, ai.suggestion ? `[AI] ${ai.suggestion}` : ''].filter(Boolean),
    };
  } catch {
    return score;
  }
}
