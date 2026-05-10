'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://habitflow-eta-five.vercel.app';

type View = 'login' | 'register' | 'magic' | 'sent';

export default function LoginPage() {
  const [view, setView] = useState<View>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function clearError() { setError(''); }

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true); clearError();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos'
          : error.message
      );
    }
    // If no error, AuthProvider handles redirect
    setLoading(false);
  }

  async function handleRegister() {
    if (!email || !password || !name) return;
    setLoading(true); clearError();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${APP_URL}/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, session is returned immediately
    if (data.session) {
      // AuthProvider handles the redirect via onAuthStateChange
      return;
    }

    // Email confirmation required — show sent screen
    setView('sent');
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email) return;
    setLoading(true); clearError();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${APP_URL}/` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setView('sent');
    setLoading(false);
  }

  if (view === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-[hsl(var(--text))] mb-3">Revisa tu email</h2>
          <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed mb-6">
            Enviamos un enlace a <strong className="text-[hsl(var(--text))]">{email}</strong>.
            Ábrelo desde tu celular para ingresar directo a la app.
          </p>
          <button onClick={() => { setView('login'); clearError(); }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            ← Volver
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="max-w-sm mx-auto w-full">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🌊</div>
          <h1 className="text-3xl font-bold text-[hsl(var(--text))]">HabitFlow</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Construye hábitos que duran</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-[hsl(var(--bg-elevated))] p-1 mb-6 gap-1">
          {[
            { id: 'login', label: 'Entrar' },
            { id: 'register', label: 'Registrarse' },
            { id: 'magic', label: '✨ Link' },
          ].map(t => (
            <button key={t.id} onClick={() => { setView(t.id as View); clearError(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                view === t.id
                  ? 'bg-[hsl(var(--bg-card))] text-[hsl(var(--text))]'
                  : 'text-[hsl(var(--text-muted))]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Name (register only) */}
          {view === 'register' && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : view === 'register' ? handleRegister() : handleMagicLink())}
              placeholder="tu@email.com"
              className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
          </div>

          {/* Password (login + register) */}
          {(view === 'login' || view === 'register') && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : handleRegister())}
                placeholder="Contraseña"
                className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-10 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
              <button onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleMagicLink}
            disabled={loading || !email || ((view === 'login' || view === 'register') && !password) || (view === 'register' && !name)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <>
                  {view === 'login' ? 'Ingresar' : view === 'register' ? 'Crear cuenta' : 'Enviar link mágico'}
                  <ArrowRight className="w-4 h-4" />
                </>
            }
          </button>

          {/* Magic link hint */}
          {view === 'magic' && (
            <p className="text-center text-xs text-[hsl(var(--text-muted))] px-2">
              Te enviamos un enlace al email. Ábrelo desde tu iPhone para entrar sin contraseña.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-[hsl(var(--text-muted))] mt-8 opacity-60">
          HabitFlow · Construye hábitos que duran 🌱
        </p>
      </motion.div>
    </div>
  );
}
