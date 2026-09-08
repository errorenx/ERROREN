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
    <div className="my-4 bg-[#0c0c0c] border border-[#1a1a1a] rounded-sm font-mono text-sm relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#080808] text-zinc-400 border-b border-[#1a1a1a] select-none text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00FF66]" />
          <span className="font-bold uppercase tracking-widest text-[10px] text-[#00FF66]">
            SYNTAX: {displayLang.toUpperCase()}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2.5 bg-[#111] border border-[#222] hover:border-[#00FF66] text-zinc-300 hover:text-[#00FF66] text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#00FF66]" />
              <span className="text-[#00FF66] font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>COPY SCHEMA</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-x-auto text-[13px] leading-relaxed text-[#e0e0e0]">
        <pre className="m-0 p-0 font-mono">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
