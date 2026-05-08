'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setOnboardingCompleted } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      } else if (pathname !== '/login') {
        router.push('/login');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session) {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();
        setOnboardingCompleted(data?.onboarding_completed ?? false);
        if (pathname === '/login') router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
