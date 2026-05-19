'use client';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useHabitStore } from '@/store/habitStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setOnboardingCompleted, setProfileLoaded } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  // Prevent concurrent initUser calls (e.g. getSession + SIGNED_IN firing together)
  const initInProgress = useRef(false);

  useEffect(() => {
    async function initUser(userId: string) {
      if (initInProgress.current) return;
      initInProgress.current = true;

      try {
        // Clear any stale local data before loading this user's data.
        // This prevents a previous user's habits from flashing when switching accounts.
        useHabitStore.setState({
          habits: [],
          commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
          synced: false,
        });
        setProfileLoaded(false);

        // Load profile and habits concurrently — profileLoaded only becomes true
        // after BOTH complete, preventing the onboarding race condition.
        const [profileRes] = await Promise.all([
          supabase.from('profiles').select('onboarding_completed').eq('id', userId).single(),
          useHabitStore.getState().loadFromSupabase(userId),
        ]);

        setOnboardingCompleted(profileRes.data?.onboarding_completed ?? false);
        setProfileLoaded(true);
      } catch (err) {
        console.error('[AuthProvider initUser]', err);
        setProfileLoaded(true); // unblock UI even on error
      } finally {
        initInProgress.current = false;
      }
    }

    // Restore existing session on mount (handles page reloads)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        await initUser(session.user.id);
      } else {
        if (pathname !== '/login' && pathname !== '/auth/callback') {
          router.push('/login?reason=expired');
        }
      }
    });

    // Handle live auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        useHabitStore.setState({
          habits: [],
          commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
          synced: false,
        });
        setProfileLoaded(false);
        setOnboardingCompleted(false);
        router.push('/login');

      } else if (event === 'SIGNED_IN' && session) {
        // Fresh login (magic link, password, OAuth)
        await initUser(session.user.id);
        if (pathname === '/login' || pathname === '/auth/callback') {
          router.push('/');
        }

      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Silent token refresh — no need to reload data, just ensure profile is loaded
        if (!useAuthStore.getState().profileLoaded) {
          await initUser(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
