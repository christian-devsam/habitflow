'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onboardingCompleted: boolean;
  // profileLoaded blocks the main page until profile + habits are both ready
  profileLoaded: boolean;
  // wasAuthenticated (persisted) lets us tell a genuine session expiry from a
  // brand-new visitor — so we only show the "sesión expiró" banner when real.
  wasAuthenticated: boolean;

  setSession: (session: Session | null) => void;
  setOnboardingCompleted: (v: boolean) => void;
  setProfileLoaded: (v: boolean) => void;
  setWasAuthenticated: (v: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: true,
      onboardingCompleted: false,
      profileLoaded: false,
      wasAuthenticated: false,

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          // Once we've seen a real session, remember it
          ...(session ? { wasAuthenticated: true } : {}),
        }),

      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      setProfileLoaded: (v) => set({ profileLoaded: v }),
      setWasAuthenticated: (v) => set({ wasAuthenticated: v }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, onboardingCompleted: false, profileLoaded: false, wasAuthenticated: false });
      },
    }),
    {
      name: 'habitflow-auth',
      // Persist onboardingCompleted + wasAuthenticated so they're available instantly on reload
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        wasAuthenticated: state.wasAuthenticated,
      }),
    }
  )
);
