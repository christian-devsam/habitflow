'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://habitflow-eta-five.vercel.app';

type View = 'login' | 'register' | 'magic' | 'sent';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🌊</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'expired';

  const [view, setView] = useState<View>('magic'); // default to magic link — simplest for mobile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

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
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) return; // AuthProvider handles redirect
    setView('sent');
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email) return;
    setLoading(true); clearError();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${APP_URL}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setView('sent');
    setResendCooldown(60);
    setLoading(false);
  }

  async function handleResend() {
    if (resendCooldown > 0 || !email) return;
    setLoading(true); clearError();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${APP_URL}/auth/callback` },
    });
    if (error) { setError(error.message); } else { setResendCooldown(60); }
    setLoading(false);
  }

  if (view === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm w-full">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-[hsl(var(--text))] mb-3">Revisa tu email</h2>
          <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed mb-2">
            Enviamos un enlace a{' '}
            <strong className="text-[hsl(var(--text))]">{email}</strong>.
          </p>
          <p className="text-[hsl(var(--text-muted))] text-xs mb-8">
            Ábrelo desde tu celular — te llevará directo a la app. El enlace expira en 1 hora.
          </p>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="flex items-center gap-2 mx-auto text-sm text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-6"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No llegó? Reenviar enlace'}
          </button>

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={() => { setView('magic'); clearError(); setResendCooldown(0); }}
            className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors"
          >
            ← Cambiar email
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
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌊</div>
          <h1 className="text-3xl font-bold text-[hsl(var(--text))]">HabitFlow</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Construye hábitos que duran</p>
        </div>

        {/* Session expired banner */}
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 text-center"
          >
            <p className="text-amber-400 text-sm font-medium">Tu sesión expiró</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Ingresa tu email para recibir un nuevo enlace mágico
            </p>
          </motion.div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-[hsl(var(--bg-elevated))] p-1 mb-6 gap-1">
          {[
            { id: 'magic', label: '✨ Link mágico' },
            { id: 'login', label: 'Contraseña' },
            { id: 'register', label: 'Registrarse' },
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
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter') return;
                if (view === 'login') handleLogin();
                else if (view === 'register') handleRegister();
                else handleMagicLink();
              }}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Password (login + register) */}
          {(view === 'login' || view === 'register') && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : handleRegister())}
                placeholder="Contraseña"
                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-10 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors"
              />
              <button onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Magic link hint */}
          {view === 'magic' && (
            <p className="text-xs text-[hsl(var(--text-muted))] px-1 pb-1">
              Te enviamos un enlace a tu email. Ábrelo desde tu iPhone y entras directo, sin contraseña.
              El enlace dura 1 hora — si expira, pide uno nuevo aquí.
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* CTA */}
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
        </div>

        <p className="text-center text-xs text-[hsl(var(--text-muted))] mt-8 opacity-60">
          HabitFlow · Construye hábitos que duran 🌱
        </p>
      </motion.div>
    </div>
  );
}
