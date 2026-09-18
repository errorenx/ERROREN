import React, { useState, useEffect } from 'react';
import { X, User, Check, LogIn, UserPlus, AlertCircle, Lock, Mail } from 'lucide-react';
import { signUpWithEmail, loginWithEmail } from '../lib/supabase';
import { UserProfile } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  initialMode?: 'register' | 'login';
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [name, setName] = useState(currentProfile?.name || '');
  const [email, setEmail] = useState(currentProfile?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
      setName(currentProfile?.name || '');
      setEmail(currentProfile?.email || '');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialMode, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name or username.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const result = await signUpWithEmail(email.trim(), password, name.trim());
        if (result.needsEmailConfirmation) {
          setSuccessMessage('Account created! Please check your email inbox to confirm your account before logging in.');
          setTimeout(() => {
            onClose();
          }, 2400);
        } else if (result.user) {
          const newProfile: UserProfile = {
            id: result.user.id,
            name: name.trim() || email.split('@')[0],
            email: email.trim(),
            savedAt: Date.now(),
          };
          onSaveProfile(newProfile);
          setSuccessMessage('Account created successfully!');
          setTimeout(() => {
            onClose();
          }, 700);
        }
      } else {
        // Login mode
        const { profile } = await loginWithEmail(email.trim(), password);
        onSaveProfile(profile);
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your details.');
    } finally {
      setIsLoading(false);
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
              {mode === 'register' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {mode === 'register' ? 'Create New Account' : 'Account Login'}
              </h2>
              <p className="text-[11px] opacity-70" style={{ color: 'var(--text-muted)' }}>
                {mode === 'register' ? 'Sign up for ERROREN AI platform' : 'Welcome back to your workspace'}
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

        {/* Tab Switcher: Only 2 options (Create Account or Login) */}
        <div
          className="grid grid-cols-2 p-1.5 m-5 mb-0 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'shadow-xs' : 'opacity-65 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'register' ? 'var(--accent)' : 'transparent',
              color: mode === 'register' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'shadow-xs' : 'opacity-65 hover:opacity-100'
            }`}
            style={{
              backgroundColor: mode === 'login' ? 'var(--accent)' : 'transparent',
              color: mode === 'login' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 pt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Full Name / Username <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 opacity-50" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-md border text-xs outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-base)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email Address <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-md border text-xs outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-base)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 opacity-50" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-md border text-xs outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-base)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Confirm Password <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 opacity-50" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-md border text-xs outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-base)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs mt-3"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{mode === 'register' ? 'Complete Registration' : 'Sign In To Account'}</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setError(null);
              }}
              className="text-[11px] font-mono opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: 'var(--accent)' }}
            >
              {mode === 'register'
                ? 'Already have an account? Sign In here'
                : "Don't have an account yet? Create one here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
