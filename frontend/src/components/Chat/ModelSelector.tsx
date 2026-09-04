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
    <div className="inline-flex items-center bg-[#171717] border border-[#2f2f2f] rounded-full p-1 text-xs shadow-md">
      <button
        onClick={() => onChange('ollama')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all ${
          currentProvider === 'ollama'
            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
            : 'text-gray-300 hover:text-white'
        }`}
        title="Local Ollama: Offline-ready, private local execution (llama3.2:3b)"
      >
        <Cpu className="w-3.5 h-3.5 text-white" />
        <span>Local Ollama</span>
        <span
          className={`w-2 h-2 rounded-full ring-2 ring-[#171717] ${
            ollamaStatus === 'online' ? 'bg-emerald-300 animate-pulse' : 'bg-amber-400'
          }`}
          title={ollamaStatus === 'online' ? 'Ollama Online' : 'Ollama Standby'}
        />
      </button>

      <button
        onClick={() => onChange('openai')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all ${
          currentProvider === 'openai'
            ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
            : 'text-gray-300 hover:text-white'
        }`}
        title="Cloud OpenAI GPT-4o-mini"
      >
        <Zap className="w-3.5 h-3.5 text-amber-300" />
        <span>GPT-4o</span>
      </button>

      <button
        onClick={() => onChange('claude')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all ${
          currentProvider === 'claude'
            ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
            : 'text-gray-300 hover:text-white'
        }`}
        title="Cloud Claude 3.5 Sonnet: Advanced reasoning"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
        <span>Claude 3.5</span>
      </button>
    </div>
  );
};
