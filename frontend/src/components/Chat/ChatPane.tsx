import React, { useState, useRef, useEffect } from 'react';
import { Message, Artifact } from '../../types';
import { MessageItem } from './MessageItem';
import { ModelSelector } from './ModelSelector';
import { Send, Feather, Sparkles, Plus, AlertCircle, RefreshCw } from 'lucide-react';

interface ChatPaneProps {
  messages: Message[];
  isStreaming: boolean;
  currentStatus: string | null;
  provider: 'ollama' | 'openai' | 'claude';
  onProviderChange: (provider: 'ollama' | 'openai' | 'claude') => void;
  ollamaStatus?: string;
  onSendMessage: (text: string, mode: 'default' | 'ship30') => void;
  onNewChat: () => void;
  onOpenArtifact: (artifact: Artifact) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  messages,
  isStreaming,
  currentStatus,
  provider,
  onProviderChange,
  ollamaStatus,
  onSendMessage,
  onNewChat,
  onOpenArtifact,
}) => {
  const [input, setInput] = useState('');
  const [isShip30, setIsShip30] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    onSendMessage(text, isShip30 ? 'ship30' : 'default');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    {
      label: "Elena Verna: PLG vs SLG",
      text: "What does Elena Verna say about B2B product-led growth vs sales-led growth?",
      mode: 'default' as const
    },
    {
      label: "Shreyas Doshi: LNO Framework",
      text: "Explain Shreyas Doshi's LNO framework and how product managers should manage their energy.",
      mode: 'default' as const
    },
    {
      label: "Brian Chesky: Founder Mode",
      text: "What did Brian Chesky learn about Founder Mode and eliminating bureaucratic product management?",
      mode: 'default' as const
    },
    {
      label: "Ship 30: Great PMs Essay",
      text: "Turn Shreyas Doshi's advice on Good vs Great Product Managers into a Ship 30 for 30 essay.",
      mode: 'ship30' as const
    },
    {
      label: "Interactive PLG Calculator",
      text: "Create an interactive PLG vs SLG ROI calculator widget in HTML/CSS with sliders for monthly signups and viral coefficient.",
      mode: 'default' as const
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700/60 shadow-sm"
            title="Start a new chat session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          <div className="hidden sm:block">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              The Lenny Growth Assistant
            </h2>
            <p className="text-[10px] text-slate-400">Grounded in 200+ hours of Lenny's Podcast Transcripts</p>
          </div>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2">
          <ModelSelector
            currentProvider={provider}
            onChange={onProviderChange}
            ollamaStatus={ollamaStatus}
          />
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to The Lenny Growth Assistant</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Ask complex questions on product-led growth, retention loops, founder mode, and execution.
              Every answer is strictly grounded in verified podcast transcripts.
            </p>

            <div className="w-full">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-left">
                Suggested Evaluator Prompts:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (qp.mode === 'ship30') setIsShip30(true);
                      onSendMessage(qp.text, qp.mode);
                    }}
                    className="p-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                  >
                    <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 mb-1 flex items-center justify-between">
                      <span>{qp.label}</span>
                      {qp.mode === 'ship30' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-mono">
                          Ship 30
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">{qp.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-900/40 pb-4">
            {messages.map((m) => (
              <MessageItem key={m.id} message={m} onOpenArtifact={onOpenArtifact} />
            ))}
            {currentStatus && (
              <div className="px-6 py-3 flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/20 border-y border-emerald-900/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{currentStatus}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Composer Area */}
      <div className="border-t border-slate-800/80 p-4 bg-slate-900/40 backdrop-blur">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-between px-1">
            {/* Ship 30 for 30 Toggle Switch */}
            <button
              type="button"
              onClick={() => setIsShip30(!isShip30)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isShip30
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Ship 30 for 30 Mode:</span>
              <span className="font-bold uppercase tracking-wider">{isShip30 ? 'ON' : 'OFF'}</span>
            </button>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Shift + Enter</kbd> for newline
            </span>
          </div>

          <div className="relative flex items-center">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isShip30
                  ? "Enter a topic or guest advice to turn into a 1,250-word Ship 30 for 30 essay..."
                  : "Ask a product, growth, or strategy question from Lenny's transcripts..."
              }
              rows={2}
              className="w-full pr-14 pl-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/80 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="absolute right-3 p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all shadow-md"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
