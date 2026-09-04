import React from 'react';
import { Cpu, Sparkles, Zap } from 'lucide-react';

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
    <div className="inline-flex items-center bg-gray-100 border border-gray-200/90 rounded-full p-1 text-xs shadow-2xs">
      <button
        onClick={() => onChange('ollama')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
          currentProvider === 'ollama'
            ? 'bg-white text-emerald-700 shadow-xs border border-gray-200'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Local Ollama: Offline-ready, private local execution (llama3.2:3b)"
      >
        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
        <span>Local Ollama</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ring-2 ring-white ${
            ollamaStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
          }`}
          title={ollamaStatus === 'online' ? 'Ollama Online' : 'Ollama Standby'}
        />
      </button>

      <button
        onClick={() => onChange('openai')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
          currentProvider === 'openai'
            ? 'bg-white text-amber-700 shadow-xs border border-gray-200'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Cloud OpenAI GPT-4o-mini"
      >
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span>GPT-4o</span>
      </button>

      <button
        onClick={() => onChange('claude')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
          currentProvider === 'claude'
            ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Cloud Claude 3.5 Sonnet: Advanced reasoning"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Claude 3.5</span>
      </button>
    </div>
  );
};
