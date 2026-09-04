import React, { useState, useRef, useEffect } from 'react';
import { Message, Artifact } from '../../types';
import { MessageItem } from './MessageItem';
import { ModelSelector } from './ModelSelector';
import {
  Sparkles,
  Plus,
  PenTool,
  TrendingUp,
  Sliders,
  Compass,
  ArrowUp,
  Square,
  PanelLeft
} from 'lucide-react';

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
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
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
  sidebarOpen,
  onToggleSidebar,
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(text, isShip30 ? 'ship30' : 'default');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const starterCards = [
    {
      icon: TrendingUp,
      title: "Elena Verna on PLG",
      desc: "Compare B2B product-led growth vs sales-led growth models",
      prompt: "What does Elena Verna say about B2B product-led growth vs sales-led growth?",
      mode: 'default' as const
    },
    {
      icon: Sliders,
      title: "Shreyas Doshi: LNO",
      desc: "How product managers should manage their energy & leverage",
      prompt: "Explain Shreyas Doshi's LNO framework and how product managers should manage their energy.",
      mode: 'default' as const
    },
    {
      icon: Compass,
      title: "Brian Chesky: Founder Mode",
      desc: "Eliminating bureaucratic PMs and elevating product craft",
      prompt: "What did Brian Chesky learn about Founder Mode and eliminating bureaucratic product management?",
      mode: 'default' as const
    },
    {
      icon: PenTool,
      title: "Ship 30 for 30 Essay",
      desc: "Turn tactical PM advice into a high-retention ~1,250-word essay",
      prompt: "Turn Shreyas Doshi's advice on Good vs Great Product Managers into a Ship 30 for 30 essay.",
      mode: 'ship30' as const
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 relative">
      {/* Top Navbar */}
      <header className="h-14 border-b border-gray-200 px-4 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-gray-100 transition-colors"
              title="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all"
            title="Start new chat session"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Center/Right: Balanced Model Selector */}
        <div className="flex items-center gap-2">
          <ModelSelector
            currentProvider={provider}
            onChange={onProviderChange}
            ollamaStatus={ollamaStatus}
          />
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto pb-44 pt-4">
        {messages.length === 0 ? (
          /* Balanced Hero Empty State */
          <div className="max-w-2xl mx-auto px-4 pt-10 sm:pt-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm ring-2 ring-emerald-500/20 mb-5">
              <Sparkles className="w-6 h-6" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2.5">
              What growth strategy are you exploring?
            </h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto mb-9 leading-relaxed font-normal">
              Grounded in 200+ hours of Lenny's Podcast archives with Elena Verna, Shreyas Doshi, Brian Chesky, and Casey Winters.
            </p>

            {/* 2x2 Starter Cards Grid with Soft Borders & Comfortable Typography */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {starterCards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (card.mode === 'ship30') setIsShip30(true);
                      onSendMessage(card.prompt, card.mode);
                    }}
                    className="p-4 rounded-2xl bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-emerald-500/40 transition-all duration-200 group flex flex-col justify-between shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm text-slate-800 group-hover:text-slate-900">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Centered Chat Thread */
          <div className="max-w-3xl mx-auto divide-y divide-gray-100">
            {messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                onOpenArtifact={onOpenArtifact}
              />
            ))}

            {/* Live Streaming Status Pill */}
            {isStreaming && (
              <div className="py-4 px-6 flex items-center gap-3 text-xs text-emerald-700 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span className="font-mono">{currentStatus || "Searching transcript archives..."}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Modern Composer */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-4 px-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-3xl bg-white border border-gray-300 hover:border-gray-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-lg transition-all"
          >
            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask a product, growth, or strategy question from Lenny's transcripts..."
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 font-normal text-sm sm:text-base px-5 pt-4 pb-14 focus:outline-none resize-none max-h-48 overflow-y-auto"
            />

            {/* Bottom Toolbar inside the Composer */}
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between">
              {/* Ship 30 Mode Toggle Pill */}
              <button
                type="button"
                onClick={() => setIsShip30(!isShip30)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isShip30
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-slate-600 border border-gray-200'
                }`}
                title="Ship 30 for 30 Mode: Generates high-retention ~1,250-word essays with bold anchor words"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Ship 30 Mode</span>
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-full ${isShip30 ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-slate-600'}`}>
                  {isShip30 ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Send / Stop Action Button */}
              <button
                type="submit"
                disabled={!input.trim() && !isStreaming}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isStreaming
                    ? 'bg-amber-600 text-white animate-pulse shadow-xs'
                    : input.trim()
                    ? 'bg-slate-900 text-white hover:bg-black shadow-xs scale-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
                title={isStreaming ? "Streaming response..." : "Send message"}
              >
                {isStreaming ? (
                  <Square className="w-3 h-3 fill-current" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2]" />
                )}
              </button>
            </div>
          </form>

          {/* Micro Disclaimer */}
          <p className="text-center text-[11px] text-slate-400 font-normal mt-2">
            The Lenny Growth Assistant is strictly grounded in actual podcast transcripts. Includes verified citations.
          </p>
        </div>
      </div>
    </div>
  );
};
