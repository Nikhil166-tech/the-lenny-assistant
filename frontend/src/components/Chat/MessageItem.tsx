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

  // Modern Markdown formatting with high-contrast Black & White styling
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
            <div key={`code-${idx}`} className="my-4 rounded-xl overflow-hidden border-2 border-gray-800 bg-[#121212] shadow-md">
              <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-gray-800 text-xs text-gray-200 font-mono">
                <span className="font-bold">{codeLang || 'code'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeText)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
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
          <h3 key={idx} className="text-base font-extrabold text-black mt-5 mb-2 flex items-center gap-2">
            {line.slice(4)}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-lg font-black text-black mt-6 mb-3 pb-1 border-b-2 border-gray-200">
            {line.slice(3)}
          </h2>
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-black text-black mt-7 mb-4">
            {line.slice(2)}
          </h1>
        );
        return;
      }
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
        const sub = line.slice(2);
        const parts = sub.split(/(\*\*.*?\*\*)/g);
        elements.push(
          <li key={idx} className="ml-5 list-disc text-gray-900 my-1.5 leading-relaxed marker:text-black">
            {parts.map((p, pidx) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pidx} className="text-black font-extrabold">{p.slice(2, -2)}</strong>
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
          <blockquote key={idx} className="border-l-4 border-black pl-4 italic text-gray-800 my-3 bg-gray-100 py-2.5 rounded-r-lg font-medium">
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
        <p key={idx} className="my-2 leading-relaxed text-gray-900 text-sm sm:text-base font-normal">
          {parts.map((p, pidx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pidx} className="text-black font-extrabold">{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith('[Episode:')) {
              return (
                <span key={pidx} className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 shadow-2xs">
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
      <div className="py-3.5 px-4 sm:px-6 flex justify-end">
        {/* Pitch Black User Pill */}
        <div className="max-w-[85%] sm:max-w-[75%] bg-black text-white rounded-3xl rounded-br-md px-5 py-3.5 shadow-md border border-gray-800">
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 flex gap-4 group hover:bg-gray-50/80 transition-colors">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 pt-1">
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-md ring-2 ring-emerald-500/30">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      <div className="flex-grow min-w-0 space-y-3">
        {/* Header with High-Contrast Model Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-black">Lenny Growth Assistant</span>
            {message.provider && (
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-black border border-gray-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                via {message.provider}
              </span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm sm:text-base text-gray-900 max-w-none leading-relaxed">
          {renderFormattedText(message.content)}
        </div>

        {/* Generated Artifact Inline Card with Bold Button */}
        {message.artifact && (
          <div className="mt-4 p-4 rounded-2xl bg-white border-2 border-emerald-600 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-emerald-400 shadow-xs">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-black">{message.artifact.title}</h4>
                <p className="text-xs text-gray-500 font-mono capitalize font-medium">{message.artifact.artifact_type} Artifact • Ready to Preview</p>
              </div>
            </div>
            <button
              onClick={() => onOpenArtifact(message.artifact!)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-md"
            >
              <span>Open Canvas</span>
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        )}

        {/* Grounded Citation Sources Accordion with High Contrast */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-black hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>{message.sources.length} Grounded Transcript Sources</span>
              </div>
              {sourcesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {sourcesOpen && (
              <div className="p-3.5 border-t-2 border-gray-200 bg-gray-50 space-y-2.5">
                {message.sources.map((src, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white border border-gray-300 text-xs space-y-1 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">{src.guest}</span>
                      <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        {Math.round(src.score * 100)}% match
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-800 font-semibold">{src.episode}</div>
                    <p className="text-gray-600 italic font-mono text-[11px] line-clamp-2">"{src.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-2 pt-2 text-gray-600">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-black transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setLiked(liked === true ? null : true)}
            className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${liked === true ? 'text-black bg-gray-200' : 'hover:text-black'}`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLiked(liked === false ? null : false)}
            className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${liked === false ? 'text-black bg-gray-200' : 'hover:text-black'}`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
