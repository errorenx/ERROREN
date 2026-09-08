import React, { useState } from 'react';
import { X, User, Check, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { UserProfile } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  onGoogleSignIn?: () => Promise<void>;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentProfile?.name || '');
  const [email, setEmail] = useState(currentProfile?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a display name.');
      return;
    }

    const trimmedEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}@local.user`;
    const profile: UserProfile = {
      id: currentProfile?.id || `user_${Date.now()}`,
      name: name.trim(),
      email: trimmedEmail,
      savedAt: Date.now(),
    };

    onSaveProfile(profile);
    setSaveSuccess(true);
    setError(null);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSaveProfile({
          id: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          avatar: user.photoURL || undefined,
          savedAt: Date.now(),
        });
      }
      setGoogleLoading(false);
      onClose();
    } catch (err: any) {
      setGoogleLoading(false);
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        // Normal dismissal
      } else {
        console.error('Sign-in issue:', err);
        setError(err.message || 'Could not complete login. You can use direct save instead.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md rounded-xl border shadow-2xl overflow-hidden transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-base)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
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
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                User Account &amp; Profile
              </h2>
              <p className="text-[11px] opacity-70" style={{ color: 'var(--text-muted)' }}>
                Direct save with zero verification required
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Profile saved successfully!</span>
            </div>
          )}

          {/* Direct Instant Save Form (No verification) */}
          <form onSubmit={handleDirectSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Full Name / Username <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maya Rajput"
                required
                className="w-full px-3.5 py-2 rounded-md border text-xs outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-base)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email Address <span className="opacity-60 text-[10px] lowercase">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full px-3.5 py-2 rounded-md border text-xs outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-base)',
                  color: 'var(--text-primary)',
                }}
              />
              <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                Instant save — no confirmation email or SMS code needed.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs mt-2"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Activate Profile</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
            <span
              className="absolute px-3 text-[10px] uppercase font-mono tracking-widest"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-muted)',
              }}
            >
              or continue with
            </span>
          </div>

          {/* Quick Google 1-Tap Option */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-md border text-xs font-semibold tracking-wider transition-all cursor-pointer opacity-90 hover:opacity-100"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-base)',
              color: 'var(--text-primary)',
            }}
          >
            {googleLoading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Quick Google Sign-In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
