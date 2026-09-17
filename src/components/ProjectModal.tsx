import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, Check } from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const PROJECT_COLORS = [
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    onCreateProject({
      name: name.trim(),
      description: description.trim() || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      color: selectedColor,
    });

    setName('');
    setDescription('');
    setSystemPrompt('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-base)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Create New Project
              </h2>
              <p className="text-[11px] opacity-70" style={{ color: 'var(--text-muted)' }}>
                Organize dedicated chat threads and custom instructions for this project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. E-Commerce Redesign, Python Tools, Mobile App"
              className="w-full p-2.5 rounded-lg border text-xs outline-none font-mono transition-colors"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-base)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>
              Description <span className="opacity-50 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief objective of this project"
              className="w-full p-2.5 rounded-lg border text-xs outline-none font-mono transition-colors"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-base)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>Project AI Instructions <span className="opacity-50 lowercase font-normal">(optional)</span></span>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="e.g. Always respond as an expert React developer specializing in Next.js and Tailwind CSS..."
              rows={3}
              className="w-full p-2.5 rounded-lg border text-xs outline-none font-mono leading-relaxed transition-colors"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-base)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Project Accent Color
            </label>
            <div className="flex items-center gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                    selectedColor === c ? 'scale-115 ring-2 ring-white shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div
            className="flex items-center justify-end gap-3 pt-4 border-t mt-6 shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs opacity-70 hover:opacity-100 uppercase tracking-wider transition-opacity cursor-pointer font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs font-mono"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
