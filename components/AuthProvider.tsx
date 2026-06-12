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
  // Prevents concurrent initUser runs (INITIAL_SESSION + SIGNED_IN can overlap)
  const initInProgress = useRef(false);

  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    async function initUser(userId: string) {
      if (initInProgress.current) return;
      initInProgress.current = true;

      // Safety net: never let the loader hang forever. If the profile/habits
      // queries stall (flaky network on PWA resume), unblock the UI after 8s.
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => {
        useHabitStore.setState({ synced: true });
        setProfileLoaded(true);
      }, 8000);

      try {
        // Clear stale local data before loading this user's data (prevents a
        // previous account's habits from flashing when switching users).
        useHabitStore.setState({
          habits: [],
          commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
          synced: false,
        });
        setProfileLoaded(false);

        // Load profile + habits concurrently; profileLoaded flips true only
        // after BOTH finish, avoiding the onboarding race condition.
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
        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        initInProgress.current = false;
      }
    }

    function redirectToLogin() {
      if (pathname !== '/login' && pathname !== '/auth/callback') {
        // Only flag "expired" if there was a real session before; a brand-new
        // visitor just lands on a clean /login.
        const expired = useAuthStore.getState().wasAuthenticated;
        useAuthStore.setState({ wasAuthenticated: false });
        router.replace(expired ? '/login?reason=expired' : '/login');
      }
    }

    // onAuthStateChange is the single source of truth. On mount it fires
    // INITIAL_SESSION with the persisted session (or null), which also covers
    // page reloads and PWA resume — so we don't need a separate getSession()
    // (that call can hang on iOS PWA resume due to auth-lock contention).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        useHabitStore.setState({
          habits: [],
          commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
          synced: false,
        });
        setProfileLoaded(false);
        setOnboardingCompleted(false);
        useAuthStore.setState({ wasAuthenticated: false });
        router.replace('/login');
        return;
      }

      if (session) {
        // Silent token refresh once already loaded → nothing to do
        if (event === 'TOKEN_REFRESHED' && useAuthStore.getState().profileLoaded) return;

        // CRITICAL: never call supabase methods synchronously inside this
        // callback — supabase holds an internal lock and doing so deadlocks
        // (this is what left the PWA stuck on "Sincronizando hábitos..." on
        // reopen). Defer the data loading to a macrotask.
        const userId = session.user.id;
        setTimeout(() => {
          initUser(userId).then(() => {
            if (event === 'SIGNED_IN' && (pathname === '/login' || pathname === '/auth/callback')) {
              router.replace('/');
            }
          });
        }, 0);
      } else {
        // No session (INITIAL_SESSION with null) → go to login
        setTimeout(redirectToLogin, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
