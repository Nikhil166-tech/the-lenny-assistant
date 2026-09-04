import React from 'react';
import { Cpu, Sparkles, Zap, Check } from 'lucide-react';

interface ModelSelectorProps {
  currentProvider: 'ollama' | 'openai' | 'claude';
  onChange: (provider: 'ollama' | 'openai' | 'claude') => void;
  ollamaStatus?: string;
  cloudProviderName?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentProvider,
  onChange,
  ollamaStatus,
}) => {
  return (
    <div className="inline-flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full p-1 text-xs shadow-inner">
      <button
        onClick={() => onChange('ollama')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
          currentProvider === 'ollama'
            ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Local Ollama: Offline-ready, private local execution (llama3.2:3b)"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span>Local Ollama</span>
        <span
          className={`w-2 h-2 rounded-full ring-2 ring-slate-900 ${
            ollamaStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
          title={ollamaStatus === 'online' ? 'Ollama Online' : 'Ollama Standby'}
        />
      </button>

      <button
        onClick={() => onChange('openai')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
          currentProvider === 'openai'
            ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700/80'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Cloud OpenAI GPT-4o-mini"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>GPT-4o</span>
      </button>

      <button
        onClick={() => onChange('claude')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
          currentProvider === 'claude'
            ? 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-700/80'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Cloud Claude 3.5 Sonnet: Advanced reasoning"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Claude 3.5</span>
      </button>
    </div>
  );
};
