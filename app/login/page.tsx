'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type View = 'login' | 'register' | 'reset' | 'registered';

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
  const passwordRecovery = searchParams.get('reason') === 'recovery';

  const [view, setView] = useState<View>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  function clearError() { setError(''); }
  function switchView(v: View) { setView(v); clearError(); setResetSent(false); }

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
    // On success AuthProvider handles the redirect
    setLoading(false);
  }

  async function handleRegister() {
    if (!email || !password || !name) return;
    setLoading(true); clearError();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) {
      // Email confirmation disabled → session ready, AuthProvider handles redirect
      return;
    }
    // Email confirmation required → guide the user
    setView('registered');
    setLoading(false);
  }

  async function handleReset() {
    if (!email) return;
    setLoading(true); clearError();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://habitflow-eta-five.vercel.app'}/auth/callback`,
    });
    if (error) { setError(error.message); } else { setResetSent(true); }
    setLoading(false);
  }

  // ── Account registered, waiting for email confirmation ──
  if (view === 'registered') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[hsl(var(--bg))]">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full text-center space-y-5">
          <div className="text-6xl">📬</div>
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-2">Confirma tu email</h2>
            <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed">
              Enviamos un link de confirmación a <strong className="text-[hsl(var(--text))]">{email}</strong>.
            </p>
          </div>
          <div className="space-y-2.5 text-left">
            {[
              { n: '1', text: 'Abre el email y toca el enlace de confirmación' },
              { n: '2', text: 'Se abrirá en Safari — eso es normal, solo confirma la cuenta' },
              { n: '3', text: 'Regresa a la app en tu pantalla de inicio e ingresa con tu contraseña' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))]">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {s.n}
                </span>
                <p className="text-sm text-[hsl(var(--text))]">{s.text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => switchView('login')}
            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm"
          >
            Ya confirmé — Ingresar
          </button>
          <button onClick={() => switchView('register')}
            className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors">
            ← Volver
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="max-w-sm mx-auto w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌊</div>
          <h1 className="text-3xl font-bold text-[hsl(var(--text))]">HabitFlow</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Construye hábitos que duran</p>
        </div>

        {/* Session expired banner */}
        {(sessionExpired || passwordRecovery) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 text-center"
          >
            <p className="text-amber-400 text-sm font-medium">
              {passwordRecovery ? 'Contraseña actualizada' : 'Tu sesión expiró'}
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">Ingresa nuevamente con tu contraseña</p>
          </motion.div>
        )}

        {/* Tabs: Ingresar / Registrarse */}
        {view !== 'reset' && (
          <div className="flex rounded-2xl bg-[hsl(var(--bg-elevated))] p-1 mb-6 gap-1">
            {[
              { id: 'login' as View, label: 'Ingresar' },
              { id: 'register' as View, label: 'Crear cuenta' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => switchView(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  view === t.id
                    ? 'bg-[hsl(var(--bg-card))] text-[hsl(var(--text))] shadow-sm'
                    : 'text-[hsl(var(--text-muted))]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Reset password ── */}
          {view === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-[hsl(var(--text))] mb-1">Recuperar contraseña</h2>
                <p className="text-[hsl(var(--text-muted))] text-sm">
                  Te enviaremos un enlace para crear una nueva contraseña.
                </p>
              </div>

              {resetSent ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                  <p className="text-sm text-[hsl(var(--text))] font-medium">¡Enlace enviado!</p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">
                    Revisa tu email y sigue el enlace para crear una nueva contraseña.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReset()}
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-xs">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 text-white font-bold text-sm transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar enlace <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </>
              )}

              <button
                onClick={() => switchView('login')}
                className="w-full text-center text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors pt-1"
              >
                ← Volver al inicio
              </button>
            </motion.div>
          )}

          {/* ── Login / Register ── */}
          {view !== 'reset' && (
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {/* Name (register only) */}
              {view === 'register' && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : handleRegister())}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors"
                />
              </div>

              {/* Password */}
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
                <button
                  onPointerDown={e => { e.preventDefault(); setShowPw(v => !v); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* CTA */}
              <button
                onPointerDown={e => e.preventDefault()}
                onPointerUp={view === 'login' ? handleLogin : handleRegister}
                disabled={loading || !email || !password || (view === 'register' && !name)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>{view === 'login' ? 'Ingresar' : 'Crear cuenta'} <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {/* Forgot password — only on login */}
              {view === 'login' && (
                <button
                  onClick={() => switchView('reset')}
                  className="w-full text-center text-xs text-[hsl(var(--text-muted))] hover:text-blue-400 transition-colors pt-1"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-[hsl(var(--text-muted))] mt-10 opacity-60">
          HabitFlow · Construye hábitos que duran 🌱
        </p>
      </motion.div>
    </div>
  );
}
