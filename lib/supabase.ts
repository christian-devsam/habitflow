import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: string;
  color: string;
  schedule: Json;
  levels: Json;
  current_difficulty_level: string;
  environment_setup_status: string;
  streak_resilience_points: number;
  current_streak: number;
  best_streak: number;
  commitment_contribution: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbDailyLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  level_completed: string | null;
  emergency_mode: boolean;
  justification: string | null;
  points_earned: number;
  created_at: string;
}

export interface DbCommitmentFund {
  user_id: string;
  balance: number;
  total_earned: number;
  total_lost: number;
  updated_at: string;
}

export interface DbCommitmentTransaction {
  id: string;
  user_id: string;
  habit_id: string | null;
  date: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

export interface DbUserContext {
  user_id: string;
  busy_level: string;
  energy_level: number;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  push_subscription: Json | null;
  updated_at: string;
}
