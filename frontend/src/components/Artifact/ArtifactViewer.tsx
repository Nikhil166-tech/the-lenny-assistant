import React, { useState } from 'react';
import { Artifact } from '../../types';
import { SandboxedIframe } from './SandboxedIframe';
import { Eye, Code, Copy, Check, X, ShieldAlert, FileText } from 'lucide-react';

interface ArtifactViewerProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHtml = artifact.artifact_type.toLowerCase() === 'html';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 animate-in slide-in-from-right duration-300">
      {/* Top Bar Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {isHtml ? <Code className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{artifact.title}</h3>
            <p className="text-[10px] text-slate-400 font-mono uppercase">{artifact.artifact_type} Canvas</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Tabs */}
          {isHtml && (
            <div className="flex items-center bg-slate-800/80 rounded-md p-0.5 text-xs mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                  activeTab === 'preview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                  activeTab === 'code' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy Code to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Context Banner */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Sandboxed Context
        </span>
        <span className="text-slate-400">Parent cookies & DOM isolated</span>
      </div>

      {/* Canvas Body */}
      <div className="flex-grow p-4 overflow-auto">
        {isHtml && activeTab === 'preview' ? (
          <SandboxedIframe content={artifact.content} title={artifact.title} />
        ) : (
          <div className="h-full bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs overflow-auto text-emerald-300">
            <pre className="whitespace-pre-wrap">{artifact.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
