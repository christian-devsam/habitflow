'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Listen for SIGNED_IN which fires once Supabase processes the hash token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // AuthProvider (in layout) handles initUser; we just redirect
        router.replace('/');
      }
    });

    // Also check if a session already exists (user refreshed the callback page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });

    // Fallback: if nothing happens in 12 seconds, token is invalid or expired
    const timeout = setTimeout(() => {
      router.replace('/login?reason=expired');
    }, 12_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🌊</div>
        <p className="text-[hsl(var(--text-muted))] text-sm">Verificando acceso...</p>
      </div>
    </div>
  );
}
