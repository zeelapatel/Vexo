'use client';

import { useState, useCallback, useRef } from 'react';
import type { ConversationMessage } from '@/lib/interviewer/systemPrompt';
import { buildInterviewerPrompt, serializeCanvas } from '@/lib/interviewer/systemPrompt';
import { useInterviewStore } from '@/store/interviewStore';
import { useCanvasStore } from '@/store/canvasStore';
import type { PersonalityId } from '@/lib/interviewer/personalities';

const MAX_MESSAGES = 30;
const CANVAS_PROBE_DELAY_MS = 30_000;

export function useInterviewConversation(personality: PersonalityId = 'friendly') {
  const scenario = useInterviewStore((s) => s.scenario);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastCanvasRef = useRef<string>('');
  const probeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalMessages = useRef(0);

  /** Send an opening message when the interview starts */
  const sendOpeningMessage = useCallback(async () => {
    if (!scenario) return;
    const { nodes, edges } = useCanvasStore.getState();
    const canvasState = serializeCanvas(nodes, edges);
    lastCanvasRef.current = canvasState;

    const systemPrompt = buildInterviewerPrompt(scenario, nodes, edges, [], personality);
    const opening: ConversationMessage = {
      role: 'user',
      content: 'The interview has just started. Please introduce the problem and ask me where I would like to begin.',
    };

    await callInterviewer(systemPrompt, [opening]);
  }, [scenario, personality]);

  /** Send a user message and get a response */
  const sendMessage = useCallback(async (userText: string) => {
    if (!scenario || isLoading) return;
    if (totalMessages.current >= MAX_MESSAGES) return;

    const { nodes, edges } = useCanvasStore.getState();
    const canvasState = serializeCanvas(nodes, edges);
    const systemPrompt = buildInterviewerPrompt(
      scenario, nodes, edges, messages, personality, lastCanvasRef.current,
    );
    lastCanvasRef.current = canvasState;

    const userMsg: ConversationMessage = { role: 'user', content: userText, canvasSnapshot: canvasState };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    totalMessages.current++;

    // Reset canvas probe timer on user message
    if (probeTimerRef.current) clearTimeout(probeTimerRef.current);

    await callInterviewer(systemPrompt, updatedMessages.map(toAnthropicMessage));
  }, [scenario, isLoading, messages, personality]);

  async function callInterviewer(systemPrompt: string, messageHistory: { role: string; content: string }[]) {
    setIsLoading(true);
    const assistantMsg: ConversationMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch('/api/interviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: systemPrompt, messages: messageHistory }),
      });

      if (!response.ok || !response.body) {
        const fallback = response.status === 429
          ? "I'm thinking carefully about your design. Please continue building while I consider your approach."
          : "I'm temporarily unavailable. Feel free to continue building and I'll respond shortly.";
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: fallback };
          return copy;
        });
        return;
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as { type: string; delta?: { type: string; text?: string } };
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                accumulated += parsed.delta.text;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: 'assistant', content: accumulated };
                  return copy;
                });
              }
            } catch {
              // ignore parse errors in SSE stream
            }
          }
        }
      }

      totalMessages.current++;
      scheduleCanvasProbe();
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: "I'm temporarily unavailable. Continue building and I'll respond shortly." };
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  }

  function scheduleCanvasProbe() {
    if (probeTimerRef.current) clearTimeout(probeTimerRef.current);
    probeTimerRef.current = setTimeout(async () => {
      if (!scenario || isLoading || totalMessages.current >= MAX_MESSAGES) return;
      const { nodes, edges } = useCanvasStore.getState();
      const newCanvas = serializeCanvas(nodes, edges);
      if (newCanvas !== lastCanvasRef.current) {
        const delta = 'The candidate has made changes to their design. Ask a probing question about the most recent change without revealing whether it is correct.';
        await sendMessage(delta);
      }
    }, CANVAS_PROBE_DELAY_MS);
  }

  return { messages, isLoading, sendMessage, sendOpeningMessage, totalMessages: totalMessages.current };
}

function toAnthropicMessage(msg: ConversationMessage): { role: string; content: string } {
  return { role: msg.role, content: msg.content };
}
