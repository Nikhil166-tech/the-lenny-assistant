import React, { useState } from 'react';
import { Message, Artifact } from '../../types';
import {
  User,
  Sparkles,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Share2,
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

  // Modern Markdown paragraph / header / code / citation formatting
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
            <div key={`code-${idx}`} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <span>{codeLang || 'code'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeText)}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
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
          <h3 key={idx} className="text-base font-bold text-emerald-400 mt-5 mb-2 flex items-center gap-2">
            {line.slice(4)}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-lg font-bold text-slate-100 mt-6 mb-3 pb-1 border-b border-slate-800/80">
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-extrabold text-white mt-7 mb-4">
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
        const sub = line.slice(2);
        const parts = sub.split(/(\*\*.*?\*\*)/g);
        elements.push(
          <li key={idx} className="ml-5 list-disc text-slate-300 my-1.5 leading-relaxed marker:text-emerald-500">
            {parts.map((p, pidx) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pidx} className="text-emerald-300 font-semibold">{p.slice(2, -2)}</strong>
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
          <blockquote key={idx} className="border-l-4 border-emerald-500/60 pl-4 italic text-slate-300 my-3 bg-slate-900/50 py-2 rounded-r-lg">
            {line.slice(2)}
          </blockquote>
        );
        return;
      }
      if (!line.trim()) {
        elements.push(<div key={idx} className="h-3" />);
        return;
      }

      // General paragraph with bold and citations
      const parts = line.split(/(\*\*.*?\*\*|\[Episode:.*?\])/g);
      elements.push(
        <p key={idx} className="my-2 leading-relaxed text-slate-200">
          {parts.map((p, pidx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pidx} className="text-slate-100 font-semibold">{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith('[Episode:')) {
              return (
                <span key={pidx} className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 shadow-sm">
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
        <div className="max-w-[85%] sm:max-w-[75%] bg-slate-800 text-slate-100 rounded-3xl rounded-br-sm px-5 py-3 shadow-md border border-slate-700/50">
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 flex gap-4 group hover:bg-slate-900/20 transition-colors">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 pt-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md ring-2 ring-emerald-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-grow min-w-0 space-y-3">
        {/* Header with Model Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">Lenny Growth Assistant</span>
            {message.provider && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                {message.provider}
              </span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm sm:text-base text-slate-200 prose-invert max-w-none">
          {renderFormattedText(message.content)}
        </div>

        {/* Generated Artifact Inline Card */}
        {message.artifact && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-emerald-500/30 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">{message.artifact.title}</h4>
                <p className="text-xs text-slate-400 font-mono capitalize">{message.artifact.artifact_type} Artifact • Ready to Preview</p>
              </div>
            </div>
            <button
              onClick={() => onOpenArtifact(message.artifact!)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md hover:shadow-emerald-500/20"
            >
              <span>Open Canvas</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grounded Citation Sources Accordion */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-sm">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-emerald-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{message.sources.length} Grounded Transcript Sources</span>
              </div>
              {sourcesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {sourcesOpen && (
              <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2.5">
                {message.sources.map((src, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">{src.guest}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {Math.round(src.score * 100)}% match
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">{src.episode}</div>
                    <p className="text-slate-400 italic font-mono text-[11px] line-clamp-2">"{src.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ChatGPT Style Action Bar */}
        <div className="flex items-center gap-2 pt-2 text-slate-400">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setLiked(liked === true ? null : true)}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${liked === true ? 'text-emerald-400 bg-slate-800' : 'hover:text-slate-200'}`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLiked(liked === false ? null : false)}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${liked === false ? 'text-amber-400 bg-slate-800' : 'hover:text-slate-200'}`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
