import { useState, useCallback } from 'react';
import { Message, CitationSource, Artifact } from '../types';
import { API_BASE } from '../lib/api';

interface SendMessageOptions {
  sessionId: string;
  message: string;
  provider: string;
  mode: 'default' | 'ship30';
  onArtifactGenerated?: (artifact: Artifact) => void;
}

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      options: SendMessageOptions,
      setMessages: React.Dispatch<React.SetStateAction<Message[]>>
    ) => {
      const { sessionId, message, provider, mode, onArtifactGenerated } = options;

      const userMsgId = 'user-' + Date.now();
      const assistantMsgId = 'asst-' + Date.now();

      // Append user message immediately
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          content: message,
          provider,
        },
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          sources: [],
          provider,
        },
      ]);

      setIsStreaming(true);
      setCurrentStatus('Connecting to Lenny archive...');

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            message,
            provider,
            mode,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Chat API error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';
        let sources: CitationSource[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const payloadStr = trimmed.slice(5).trim();
            if (payloadStr === '[DONE]') continue;

            try {
              const event = JSON.parse(payloadStr);

              if (event.type === 'status') {
                setCurrentStatus(event.content);
              } else if (event.type === 'sources') {
                sources = event.sources;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, sources } : msg
                  )
                );
              } else if (event.type === 'token') {
                assistantContent += event.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              } else if (event.type === 'artifact') {
                if (onArtifactGenerated) {
                  onArtifactGenerated(event.artifact);
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, artifact: event.artifact }
                      : msg
                  )
                );
              } else if (event.type === 'error') {
                assistantContent += `\n\n⚠️ Error: ${event.message}`;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              }
            } catch (err) {
              console.error('Failed parsing SSE payload', err);
            }
          }
        }
      } catch (err: any) {
        console.error('Streaming error', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    msg.content +
                    `\n\n⚠️ Connection failed: ${err.message || 'Server error'}. Please check if the backend is running.`,
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        setCurrentStatus(null);
      }
    },
    []
  );

  return { isStreaming, currentStatus, sendMessage };
}
