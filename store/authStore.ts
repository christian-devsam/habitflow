'use client';
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onboardingCompleted: boolean;

  setSession: (session: Session | null) => void;
  setOnboardingCompleted: (v: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  onboardingCompleted: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, loading: false }),

  setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
