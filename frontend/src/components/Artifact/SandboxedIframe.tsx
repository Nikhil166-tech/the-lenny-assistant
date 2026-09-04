import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { ShieldCheck } from 'lucide-react';

interface SandboxedIframeProps {
  content: string;
  title: string;
}

export const SandboxedIframe: React.FC<SandboxedIframeProps> = ({ content, title }) => {
  // Sanitize markup prior to injecting into iframe srcDoc
  const cleanHtml = useMemo(() => {
    // Wrap bare HTML snippets into complete responsive document with dark/light neutral styles
    let formatted = content;
    if (!formatted.includes('<html') && !formatted.includes('<!DOCTYPE')) {
      formatted = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
    }
    input, button, select {
      font-family: inherit;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
    }

    return DOMPurify.sanitize(formatted, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['style', 'link', 'script', 'input', 'button', 'select', 'table', 'tr', 'td', 'th'],
      ADD_ATTR: ['target', 'onclick', 'id', 'class', 'style', 'type', 'value', 'placeholder', 'min', 'max', 'step']
    });
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-sm">
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase truncate">
          Artifact: {title}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Isolated Execution Sandbox</span>
        </span>
      </div>
      <iframe
        title={title}
        srcDoc={cleanHtml}
        // Strict security isolation: allow scripts to run for widget interactivity,
        // but omit allow-same-origin to prevent access to parent cookies, local storage, and DOM.
        sandbox="allow-scripts"
        className="w-full flex-grow border-none min-h-[400px]"
      />
    </div>
  );
};
