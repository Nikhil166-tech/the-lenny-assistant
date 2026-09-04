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
  cloudProviderName,
}) => {
  return (
    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
      <button
        onClick={() => onChange('ollama')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
          currentProvider === 'ollama'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Local Ollama: Offline-ready, private local execution"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span>Local Ollama</span>
        <span
          className={`w-2 h-2 rounded-full ${
            ollamaStatus === 'online' ? 'bg-emerald-300' : 'bg-amber-400'
          }`}
          title={ollamaStatus === 'online' ? 'Ollama Online' : 'Ollama Standby'}
        />
      </button>

      <button
        onClick={() => onChange('openai')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
          currentProvider === 'openai'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Cloud OpenAI GPT-4o-mini"
      >
        <Zap className="w-3.5 h-3.5 text-amber-300" />
        <span>OpenAI GPT-4o</span>
      </button>

      <button
        onClick={() => onChange('claude')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
          currentProvider === 'claude'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Cloud Claude 3.5 Sonnet: Requires Anthropic credits"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Claude 3.5</span>
      </button>
    </div>
  );
};
