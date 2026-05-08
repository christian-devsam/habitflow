'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase appends tokens to the URL hash — exchange them for a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
      else router.replace('/login');
    });
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
