'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://habitflow-eta-five.vercel.app';

type Status = 'loading' | 'confirmed' | 'error';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // Detect link type from URL hash (implicit flow) or search params (PKCE flow)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || searchParams.get('type') || '';

    // Email confirmation links have type=signup or type=email
    // OAuth and other flows either have no type or type=recovery
    const isEmailConfirmation = type === 'signup' || type === 'email';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        if (isEmailConfirmation) {
          // Confirmed in Safari — guide user back to PWA
          setStatus('confirmed');
        } else {
          // OAuth or any other sign-in — redirect to app (works for browser and PWA)
          router.replace('/');
        }
      }
    });

    // Also handle already-active session (page refresh or fast redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (isEmailConfirmation) setStatus('confirmed');
        else router.replace('/');
      }
    });

    const timeout = setTimeout(() => setStatus('error'), 12_000);
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, [router]);

  // ── Email confirmed in Safari → instruct user to go back to PWA ──────────
  if (status === 'confirmed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[hsl(var(--bg))]">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-6xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text))] mb-2">¡Cuenta confirmada!</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed">
              Tu cuenta está lista. Ahora vuelve a la app en tu pantalla de inicio.
            </p>
          </div>
          <div className="space-y-3 text-left">
            {[
              { n: '1', text: 'Cierra esta página de Safari' },
              { n: '2', text: 'Busca el ícono 🌊 HabitFlow en tu pantalla de inicio' },
              { n: '3', text: 'Ábrela e ingresa con tu email y contraseña' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))]">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                <p className="text-sm text-[hsl(var(--text))]">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--text-muted))]">
            ¿Aún no tienes la app anclada? Abre <strong className="text-[hsl(var(--text))]">{APP_URL.replace('https://', '')}</strong> en Safari → Compartir → "Agregar a pantalla de inicio"
          </p>
        </div>
      </div>
    );
  }

  // ── Token expired or invalid ─────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[hsl(var(--bg))]">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-[hsl(var(--text))]">El enlace expiró</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm">Los enlaces expiran en 1 hora. Vuelve a la app e intenta nuevamente.</p>
          <a href={APP_URL}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold">
            Ir a HabitFlow
          </a>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🌊</div>
        <p className="text-[hsl(var(--text-muted))] text-sm">Verificando...</p>
      </div>
    </div>
  );
}
