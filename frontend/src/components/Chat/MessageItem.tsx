import React, { useState } from 'react';
import { Message, Artifact } from '../../types';
import {
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Maximize2
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onOpenArtifact: (artifact: Artifact) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onOpenArtifact }) => {
  const isUser = message.role === 'user';
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Modern Markdown formatting with clean, comfortable typography
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLang = '';
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          const codeText = codeLines.join('\n');
          elements.push(
            <div key={`code-${idx}`} className="my-4 rounded-xl overflow-hidden border border-gray-200 bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs text-slate-300 font-mono">
                <span className="font-medium">{codeLang || 'code'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeText)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors text-slate-400"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy code</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
                <code>{codeText}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeLines = [];
          codeLang = '';
        } else {
          // Open code block
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
          codeLines = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-base font-semibold text-slate-800 mt-4 mb-1.5 flex items-center gap-2">
            {line.slice(4)}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-lg font-semibold text-slate-900 mt-5 mb-2 pb-1 border-b border-gray-100">
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-3">
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
        const sub = line.slice(2);
        const parts = sub.split(/(\*\*.*?\*\*)/g);
        elements.push(
          <li key={idx} className="ml-5 list-disc text-slate-700 my-1 leading-relaxed marker:text-emerald-500">
            {parts.map((p, pidx) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pidx} className="text-slate-900 font-semibold">{p.slice(2, -2)}</strong>
              ) : (
                p
              )
            )}
          </li>
        );
        return;
      }
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} className="border-l-4 border-emerald-500/70 pl-4 italic text-slate-600 my-3 bg-emerald-50/30 py-2 rounded-r-lg font-normal">
            {line.slice(2)}
          </blockquote>
        );
        return;
      }
      if (!line.trim()) {
        elements.push(<div key={idx} className="h-2.5" />);
        return;
      }

      // General paragraph with bold and citations
      const parts = line.split(/(\*\*.*?\*\*|\[Episode:.*?\])/g);
      elements.push(
        <p key={idx} className="my-2 leading-relaxed text-slate-700 text-sm sm:text-base font-normal">
          {parts.map((p, pidx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pidx} className="text-slate-900 font-semibold">{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith('[Episode:')) {
              return (
                <span key={pidx} className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  {p}
                </span>
              );
            }
            return p;
          })}
        </p>
      );
    });

    return elements;
  };

  if (isUser) {
    return (
      <div className="py-3 px-4 sm:px-6 flex justify-end">
        {/* Balanced Dark Slate User Bubble */}
        <div className="max-w-[85%] sm:max-w-[75%] bg-slate-800 text-slate-100 rounded-3xl rounded-br-md px-5 py-3 shadow-xs border border-slate-700/60 font-normal">
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5 px-4 sm:px-6 flex gap-4 group hover:bg-gray-50/50 transition-colors">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 pt-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-grow min-w-0 space-y-2.5">
        {/* Header with Model Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">Lenny Growth Assistant</span>
            {message.provider && (
              <span className="text-[10px] font-mono font-medium text-slate-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                via {message.provider}
              </span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm sm:text-base text-slate-700 max-w-none leading-relaxed">
          {renderFormattedText(message.content)}
        </div>

        {/* Generated Artifact Inline Card */}
        {message.artifact && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{message.artifact.title}</h4>
                <p className="text-xs text-slate-500 font-mono capitalize">{message.artifact.artifact_type} Artifact • Ready to Preview</p>
              </div>
            </div>
            <button
              onClick={() => onOpenArtifact(message.artifact!)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-xs"
            >
              <span>Open Canvas</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grounded Citation Sources Accordion */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3.5 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>{message.sources.length} Grounded Transcript Sources</span>
              </div>
              {sourcesOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {sourcesOpen && (
              <div className="p-3 border-t border-gray-200 bg-gray-50/60 space-y-2">
                {message.sources.map((src, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{src.guest}</span>
                      <span className="font-mono text-[10px] text-slate-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {Math.round(src.score * 100)}% match
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium">{src.episode}</div>
                    <p className="text-slate-500 italic font-mono text-[11px] line-clamp-2">"{src.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-2 pt-1.5 text-slate-400">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-slate-700 transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setLiked(liked === true ? null : true)}
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${liked === true ? 'text-emerald-600 bg-emerald-50' : 'hover:text-slate-700'}`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLiked(liked === false ? null : false)}
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${liked === false ? 'text-amber-600 bg-amber-50' : 'hover:text-slate-700'}`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
