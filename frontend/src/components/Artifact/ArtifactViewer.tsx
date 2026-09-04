import React, { useState } from 'react';
import { Artifact } from '../../types';
import { SandboxedIframe } from './SandboxedIframe';
import { Eye, Code, Copy, Check, X, FileText } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-white border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Top Bar Header */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-2.5 overflow-hidden mr-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
            {isHtml ? <Code className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{artifact.title}</h3>
            <p className="text-[10px] text-gray-500 font-mono uppercase">{artifact.artifact_type} Canvas</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Tabs */}
          {isHtml && (
            <div className="flex items-center bg-gray-200/80 rounded-lg p-0.5 text-xs mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'preview' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'code' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
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
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Copy Code to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Context Banner */}
      <div className="bg-emerald-50/70 px-4 py-1.5 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
        <span className="flex items-center gap-1.5 font-semibold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Sandboxed Context
        </span>
        <span className="text-emerald-700">Parent cookies & DOM isolated</span>
      </div>

      {/* Canvas Body */}
      <div className="flex-grow p-4 overflow-auto bg-gray-50">
        {isHtml && activeTab === 'preview' ? (
          <SandboxedIframe content={artifact.content} title={artifact.title} />
        ) : (
          <div className="h-full bg-gray-900 rounded-xl border border-gray-800 p-4 font-mono text-xs overflow-auto text-emerald-300 shadow-sm">
            <pre className="whitespace-pre-wrap">{artifact.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
