import React, { useState } from 'react';
import { Message, Artifact } from '../../types';
import { User, Bot, BookOpen, ExternalLink, ChevronDown, ChevronUp, Code2 } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onOpenArtifact: (artifact: Artifact) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onOpenArtifact }) => {
  const isUser = message.role === 'user';
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Simple Markdown paragraph / header formatting
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-emerald-400 mt-4 mb-1">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-slate-100 mt-5 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-extrabold text-white mt-6 mb-3">{line.slice(2)}</h1>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        // Highlight bold anchor words
        const sub = line.slice(2);
        const parts = sub.split(/(\*\*.*?\*\*)/g);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 my-1">
            {parts.map((p, pidx) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pidx} className="text-emerald-300 font-semibold">{p.slice(2, -2)}</strong>
              ) : (
                p
              )
            )}
          </li>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-emerald-500/40 pl-3 italic text-slate-400 my-2 bg-slate-900/40 py-1 rounded-r">
            {line.slice(2)}
          </blockquote>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      // General paragraph with bold handling
      const parts = line.split(/(\*\*.*?\*\*|\[Episode:.*?\])/g);
      return (
        <p key={idx} className="my-1.5 leading-relaxed text-slate-200">
          {parts.map((p, pidx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pidx} className="text-slate-100 font-semibold">{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith('[Episode:')) {
              return (
                <span key={pidx} className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded text-xs font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  {p}
                </span>
              );
            }
            return p;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`py-5 px-4 sm:px-6 flex gap-4 ${isUser ? 'bg-slate-950/40' : 'bg-slate-900/30 border-y border-slate-900/80'}`}>
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isUser ? 'bg-slate-800 text-slate-300' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      </div>

      <div className="flex-grow min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isUser ? 'You' : 'Lenny Growth Assistant'}
          </span>
          {message.provider && !isUser && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              via {message.provider}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm">
          {message.content ? renderFormattedText(message.content) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400 italic">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Synthesizing grounded response...
            </span>
          )}
        </div>

        {/* Generated Artifact Banner */}
        {message.artifact && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-emerald-900/60 text-emerald-300">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-300">{message.artifact.title}</div>
                <div className="text-[11px] text-emerald-400/80 uppercase font-mono">{message.artifact.artifact_type} Artifact</div>
              </div>
            </div>
            <button
              onClick={() => onOpenArtifact(message.artifact!)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-all shadow-sm"
            >
              <span>View Canvas</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grounded Sources Accordion */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {message.sources.length} Grounded Transcript Source{message.sources.length > 1 ? 's' : ''}
              </span>
              {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {sourcesOpen && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-slate-200 truncate">{src.guest}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                          {Math.round(src.score * 100)}% match
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400/90 font-medium mb-1 truncate">{src.episode}</div>
                      <div className="text-slate-400 text-[11px] line-clamp-3 italic">"{src.text}"</div>
                    </div>
                    {src.timestamp && (
                      <div className="mt-1.5 text-[10px] text-slate-400 font-mono">Timestamp: {src.timestamp}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
