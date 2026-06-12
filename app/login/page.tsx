'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://habitflow-eta-five.vercel.app';

type View = 'login' | 'register' | 'reset' | 'registered';
type OAuthProvider = 'google';

// ── Brand SVG icons ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────

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
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  function clearError() { setError(''); }
  function switchView(v: View) { setView(v); clearError(); setResetSent(false); }

  // ── OAuth ────────────────────────────────────────────────────────────────
  async function handleOAuth(provider: OAuthProvider) {
    setOauthLoading(provider);
    clearError();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
        // Request offline access for Google so we get a refresh token
        ...(provider === 'google' && {
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        }),
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
    // On success the browser redirects to the provider — no need to reset loading
  }

  // ── Email / Password ──────────────────────────────────────────────────────
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
      options: { data: { name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) return; // confirmation disabled → AuthProvider handles redirect
    setView('registered');
    setLoading(false);
  }

  async function handleReset() {
    if (!email) return;
    setLoading(true); clearError();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/callback`,
    });
    if (error) { setError(error.message); } else { setResetSent(true); }
    setLoading(false);
  }

  // ── Registration pending email confirmation ───────────────────────────────
  if (view === 'registered') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[hsl(var(--bg))]">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full text-center space-y-5">
          <div className="text-6xl">📬</div>
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-2">Confirma tu email</h2>
            <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed">
              Enviamos un link a <strong className="text-[hsl(var(--text))]">{email}</strong>.
            </p>
          </div>
          <div className="space-y-2.5 text-left">
            {[
              { n: '1', text: 'Abre el email y toca el enlace de confirmación' },
              { n: '2', text: 'Se abrirá en Safari — solo confirma la cuenta ahí' },
              { n: '3', text: 'Regresa a la app en tu pantalla de inicio e ingresa con tu contraseña' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))]">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                <p className="text-sm text-[hsl(var(--text))]">{s.text}</p>
              </div>
            ))}
          </div>
          <button onClick={() => switchView('login')}
            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm">
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

  // ── Main login / register view ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="max-w-sm mx-auto w-full">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🌊</div>
          <h1 className="text-3xl font-bold text-[hsl(var(--text))]">HabitFlow</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Construye hábitos que duran</p>
        </div>

        {/* Banners */}
        {(sessionExpired || passwordRecovery) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5 text-center">
            <p className="text-amber-400 text-sm font-medium">
              {passwordRecovery ? 'Contraseña actualizada' : 'Tu sesión expiró'}
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">Ingresa nuevamente</p>
          </motion.div>
        )}

        {view !== 'reset' && (
          <>
            {/* ── OAuth buttons ── */}
            <div className="space-y-2.5 mb-5">
              <button
                onPointerDown={e => e.preventDefault()}
                onPointerUp={() => handleOAuth('google')}
                disabled={!!oauthLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white text-gray-800 font-semibold text-sm border border-gray-200 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
              >
                {oauthLoading === 'google'
                  ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  : <GoogleIcon />
                }
                Continuar con Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--text-muted))]">o con email</span>
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            </div>
          </>
        )}

        {/* Tabs: Ingresar / Crear cuenta */}
        {view !== 'reset' && (
          <div className="flex rounded-2xl bg-[hsl(var(--bg-elevated))] p-1 mb-5 gap-1">
            {[
              { id: 'login' as View, label: 'Ingresar' },
              { id: 'register' as View, label: 'Crear cuenta' },
            ].map(t => (
              <button key={t.id} onClick={() => switchView(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  view === t.id
                    ? 'bg-[hsl(var(--bg-card))] text-[hsl(var(--text))] shadow-sm'
                    : 'text-[hsl(var(--text-muted))]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Reset password ── */}
          {view === 'reset' && (
            <motion.div key="reset"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[hsl(var(--text))] mb-1">Recuperar contraseña</h2>
                <p className="text-[hsl(var(--text-muted))] text-sm">Te enviaremos un enlace para crear una nueva.</p>
              </div>
              {resetSent ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                  <p className="text-sm text-[hsl(var(--text))] font-medium">¡Enlace enviado!</p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">Revisa tu email y sigue el enlace.</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReset()}
                      placeholder="tu@email.com" autoComplete="email"
                      className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
                  </div>
                  {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-red-400 text-xs">{error}</p></div>}
                  <button onClick={handleReset} disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 text-white font-bold text-sm transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar enlace <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </>
              )}
              <button onClick={() => switchView('login')}
                className="w-full text-center text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors pt-1">
                ← Volver al inicio
              </button>
            </motion.div>
          )}

          {/* ── Login / Register form ── */}
          {view !== 'reset' && (
            <motion.div key={view}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="space-y-3">

              {/* Name (register only) */}
              {view === 'register' && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre" autoComplete="name"
                    className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : handleRegister())}
                  placeholder="tu@email.com" autoComplete="email"
                  className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : handleRegister())}
                  placeholder="Contraseña"
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-[hsl(var(--bg-card))] rounded-xl pl-10 pr-10 py-3.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors" />
                <button onPointerDown={e => { e.preventDefault(); setShowPw(v => !v); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors">
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
                disabled={loading || !!oauthLoading || !email || !password || (view === 'register' && !name)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all">
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>{view === 'login' ? 'Ingresar' : 'Crear cuenta'} <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {view === 'login' && (
                <button onClick={() => switchView('reset')}
                  className="w-full text-center text-xs text-[hsl(var(--text-muted))] hover:text-blue-400 transition-colors pt-1">
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
