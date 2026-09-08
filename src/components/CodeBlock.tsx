import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const displayLang = language?.replace(/^language-/, '') || 'code';

  return (
    <div
      className="my-4 rounded-lg font-mono text-sm relative overflow-hidden border shadow-sm"
      style={{
        backgroundColor: 'var(--code-bg, var(--bg-card))',
        borderColor: 'var(--border-base)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b select-none text-xs"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span className="font-bold uppercase tracking-widest text-[10px]" style={{ color: 'var(--accent)' }}>
            {displayLang.toUpperCase()}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded border text-[10px] uppercase tracking-wider transition-all cursor-pointer opacity-90 hover:opacity-100"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: copied ? 'var(--accent)' : 'var(--text-primary)',
          }}
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span className="font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-x-auto text-[13px] leading-relaxed text-zinc-100 font-mono">
        <pre className="m-0 p-0 font-mono">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
