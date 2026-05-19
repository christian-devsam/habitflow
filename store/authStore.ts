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

  setSession: (session: Session | null) => void;
  setOnboardingCompleted: (v: boolean) => void;
  setProfileLoaded: (v: boolean) => void;
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

      setSession: (session) =>
        set({ session, user: session?.user ?? null, loading: false }),

      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      setProfileLoaded: (v) => set({ profileLoaded: v }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, onboardingCompleted: false, profileLoaded: false });
      },
    }),
    {
      name: 'habitflow-auth',
      // Only persist onboardingCompleted so it's available instantly on reload
      partialize: (state) => ({ onboardingCompleted: state.onboardingCompleted }),
    }
  )
);
