'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'magic' | 'password';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleMagicLink() {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  async function handlePassword() {
    setLoading(true); setError('');
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name }, emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) setError(error.message);
      else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-[hsl(var(--text))] mb-2">Revisa tu email</h2>
          <p className="text-[hsl(var(--text-muted))] text-sm">
            Te enviamos un enlace mágico a <strong className="text-[hsl(var(--text))]">{email}</strong>
          </p>
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
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">
            Tu gestor de fricción inteligente
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-xl bg-[hsl(var(--bg-elevated))] p-1 mb-6">
          {(['magic', 'password'] as Mode[]).map(m => (
            <button key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-[hsl(var(--bg-card))] text-[hsl(var(--text))]'
                  : 'text-[hsl(var(--text-muted))]'
              }`}
            >
              {m === 'magic' ? '✨ Link mágico' : '🔑 Contraseña'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isSignUp && mode === 'password' && (
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-[hsl(var(--bg-card))] rounded-xl px-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
          </div>

          {mode === 'password' && (
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full bg-[hsl(var(--bg-card))] rounded-xl px-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
          )}

          {error && (
            <p className="text-red-400 text-xs px-1">{error}</p>
          )}

          <button
            onClick={mode === 'magic' ? handleMagicLink : handlePassword}
            disabled={loading || !email}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <>
                  {mode === 'magic' ? 'Enviar link' : isSignUp ? 'Crear cuenta' : 'Entrar'}
                  <ArrowRight className="w-4 h-4" />
                </>
            }
          </button>

          {mode === 'password' && (
            <button onClick={() => setIsSignUp(v => !v)}
              className="w-full text-center text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors py-1">
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo? Crea tu cuenta'}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-[hsl(var(--text-muted))] mt-8">
          Al continuar aceptas construir mejores hábitos cada día 🌱
        </p>
      </motion.div>
    </div>
  );
}
