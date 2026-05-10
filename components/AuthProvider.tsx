'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useHabitStore } from '@/store/habitStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setOnboardingCompleted } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();
      setOnboardingCompleted(data?.onboarding_completed ?? false);
    }

    // Load initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        await loadProfile(session.user.id);
        // Reset synced so loadFromSupabase always fires on mount
        useHabitStore.setState({ synced: false });
      } else if (pathname !== '/login' && pathname !== '/auth/callback') {
        router.push('/login');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        // Clear local habit data on logout
        useHabitStore.setState({
          habits: [],
          commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
          synced: false,
        });
        router.push('/login');
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        await loadProfile(session.user.id);
        // Force fresh sync from Supabase
        useHabitStore.setState({ synced: false });
        if (pathname === '/login' || pathname === '/auth/callback') {
          router.push('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
