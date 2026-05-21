'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Status = 'loading' | 'confirmed' | 'recovery' | 'error';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // Detect the link type from the URL before Supabase clears it
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const search = new URLSearchParams(window.location.search);
    const type = hash.get('type') || search.get('type') || '';
    const isConfirmation = type === 'signup' || type === 'email';
    const isRecovery = type === 'recovery';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        if (isConfirmation) {
          // Account confirmed in Safari — tell the user to go back to the PWA
          setStatus('confirmed');
        } else if (isRecovery) {
          // Password reset — show form or redirect inside PWA
          setStatus('recovery');
        } else {
          // Normal sign-in (e.g. OAuth) — redirect inside this browser
          router.replace('/');
        }
      }
    });

    // Already has session (page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (isConfirmation) setStatus('confirmed');
        else if (isRecovery) setStatus('recovery');
        else router.replace('/');
      }
    });

    const timeout = setTimeout(() => setStatus('error'), 12_000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, [router]);

  // ── Account confirmed in Safari — guide user back to PWA ──
  if (status === 'confirmed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[hsl(var(--bg))]">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-6xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text))] mb-2">¡Cuenta confirmada!</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed">
              Tu cuenta está lista. Como estás en Safari, necesitas volver a la app en tu pantalla de inicio.
            </p>
          </div>

          {/* Visual step-by-step */}
          <div className="space-y-3 text-left">
            {[
              { n: '1', text: 'Cierra esta página de Safari' },
              { n: '2', text: 'Busca el ícono de HabitFlow 🌊 en tu pantalla de inicio' },
              { n: '3', text: 'Ábrela e ingresa con tu email y contraseña' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))]">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {s.n}
                </span>
                <p className="text-sm text-[hsl(var(--text))]">{s.text}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[hsl(var(--text-muted))]">
            ¿No tienes la app anclada?<br />
            Abre <strong className="text-[hsl(var(--text))]">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'habitflow-eta-five.vercel.app'}
            </strong> en Safari → Compartir → "Agregar a pantalla de inicio"
          </p>
        </div>
      </div>
    );
  }

  // ── Password recovery — just redirect to login ──
  if (status === 'recovery') {
    router.replace('/login?reason=recovery');
    return null;
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[hsl(var(--bg))]">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-[hsl(var(--text))]">El enlace expiró</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm">
            Los enlaces de confirmación expiran en 1 hora. Vuelve a la app y regístrate de nuevo.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL ?? '/'}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold"
          >
            Ir a HabitFlow
          </a>
        </div>
      </div>
    );
  }

  // ── Loading ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🌊</div>
        <p className="text-[hsl(var(--text-muted))] text-sm">Verificando cuenta...</p>
      </div>
    </div>
  );
}
