'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, CommitmentFund, TodayContext, DifficultyLevel, BusyLevel } from '@/lib/types';
import { suggestLevel, calculateResiliencePoints } from '@/lib/resilience';
import { todayKey } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ─── helpers ────────────────────────────────────────────────────────────────

function isRealId(id: string) {
  return id && !id.startsWith('local_') && !id.startsWith('temp_');
}

function makeFundGain(level: DifficultyLevel) {
  return level === 'minimum' ? 5 : level === 'ideal' ? 15 : 30;
}

// ─── store interface ─────────────────────────────────────────────────────────

interface HabitStore {
  habits: Habit[];
  commitment_fund: CommitmentFund;
  emergency_mode: boolean;
  today_context: TodayContext;
  // synced is NOT persisted — resets on every load
  synced: boolean;

  completeHabit: (habitId: string, level: DifficultyLevel, justification?: string) => void;
  skipHabit: (habitId: string, justification: string) => void;
  activateEmergencyMode: () => void;
  deactivateEmergencyMode: () => void;
  updateBusyLevel: (level: BusyLevel) => void;
  updateEnergyLevel: (level: number) => void;
  confirmEnvironmentSetup: (habitId: string) => void;
  setHabitLevel: (habitId: string, level: DifficultyLevel) => void;
  getSuggestedLevel: (habitId: string) => DifficultyLevel;
  addHabit: (data: Omit<Habit, 'id' | 'daily_logs' | 'current_streak' | 'best_streak' | 'streak_resilience_points' | 'current_difficulty_level'>) => Promise<string>;
  deleteHabit: (habitId: string) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  markSynced: () => void;
}

// ─── store ───────────────────────────────────────────────────────────────────

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
      emergency_mode: false,
      today_context: { busy_level: 'normal', energy_level: 70 },
      synced: false,

      // ── complete habit ───────────────────────────────────────────────────
      completeHabit: (habitId, level, justification) => {
        const today = todayKey();
        const { emergency_mode } = get();

        // Guard: already logged today?
        const existing = get().habits.find(h => h.id === habitId);
        if (!existing) return;
        if (existing.daily_logs.some(l => l.date === today)) return;

        const pts = calculateResiliencePoints(level, existing.current_streak, emergency_mode);
        const newStreak = existing.current_streak + 1;
        const fundGain = makeFundGain(level);
        const newLog = { date: today, completed: true, level_completed: level, emergency_mode, justification, points_earned: pts };
        const txId = `${Date.now()}`;

        // Update store synchronously for immediate UI feedback
        set(state => {
          const updatedHabits = state.habits.map(h => {
            if (h.id !== habitId) return h;
            return {
              ...h,
              daily_logs: [...h.daily_logs, newLog],
              current_streak: newStreak,
              best_streak: Math.max(h.best_streak, newStreak),
              streak_resilience_points: Math.min(100, h.streak_resilience_points + Math.round(pts / 5)),
              current_difficulty_level: level,
            };
          });

          const tx = { id: txId, date: today, amount: fundGain, reason: `Completado: ${existing.name} (${level})`, habit_id: habitId };

          return {
            habits: updatedHabits,
            commitment_fund: {
              ...state.commitment_fund,
              balance: state.commitment_fund.balance + fundGain,
              total_earned: state.commitment_fund.total_earned + fundGain,
              transactions: [tx, ...state.commitment_fund.transactions].slice(0, 50),
            },
          };
        });

        // Background Supabase sync (only if habit has a real UUID)
        if (!isRealId(habitId)) return;

        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (!user) return;

          const currentFund = get().commitment_fund;

          await Promise.allSettled([
            supabase.from('daily_logs').upsert({
              habit_id: habitId,
              user_id: user.id,
              date: today,
              completed: true,
              level_completed: level,
              emergency_mode,
              justification: justification ?? null,
              points_earned: pts,
            }),
            supabase.from('habits').update({
              current_streak: newStreak,
              best_streak: Math.max(existing.best_streak, newStreak),
              streak_resilience_points: Math.min(100, existing.streak_resilience_points + Math.round(pts / 5)),
              current_difficulty_level: level,
              updated_at: new Date().toISOString(),
            }).eq('id', habitId).eq('user_id', user.id),
            supabase.from('commitment_fund').upsert({
              user_id: user.id,
              balance: currentFund.balance,
              total_earned: currentFund.total_earned,
              total_lost: currentFund.total_lost,
              updated_at: new Date().toISOString(),
            }),
            supabase.from('commitment_transactions').insert({
              user_id: user.id,
              habit_id: habitId,
              date: today,
              amount: fundGain,
              reason: `Completado: ${existing.name} (${level})`,
            }),
          ]);
        });
      },

      // ── skip habit ───────────────────────────────────────────────────────
      skipHabit: (habitId, justification) => {
        const today = todayKey();
        const existing = get().habits.find(h => h.id === habitId);
        if (!existing) return;
        if (existing.daily_logs.some(l => l.date === today)) return;

        const isJustified = justification.trim().length > 8;
        const penalty = isJustified ? 0 : existing.commitment_contribution;
        const newStreak = isJustified ? existing.current_streak : 0;
        const newResil = Math.max(0, existing.streak_resilience_points - (isJustified ? 0 : 15));

        set(state => {
          const updatedHabits = state.habits.map(h => {
            if (h.id !== habitId) return h;
            return {
              ...h,
              daily_logs: [...h.daily_logs, {
                date: today, completed: false,
                emergency_mode: state.emergency_mode, justification, points_earned: -penalty,
              }],
              current_streak: newStreak,
              streak_resilience_points: newResil,
            };
          });

          const txList = penalty > 0
            ? [{ id: `${Date.now()}`, date: today, amount: -penalty, reason: `Omitido: ${existing.name}`, habit_id: habitId },
               ...state.commitment_fund.transactions].slice(0, 50)
            : state.commitment_fund.transactions;

          return {
            habits: updatedHabits,
            commitment_fund: {
              ...state.commitment_fund,
              balance: state.commitment_fund.balance - penalty,
              total_lost: state.commitment_fund.total_lost + penalty,
              transactions: txList,
            },
          };
        });

        if (!isRealId(habitId)) return;
        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (!user) return;
          const currentFund = get().commitment_fund;
          await Promise.allSettled([
            supabase.from('daily_logs').upsert({
              habit_id: habitId, user_id: user.id, date: today,
              completed: false, emergency_mode: get().emergency_mode,
              justification: justification ?? null, points_earned: -penalty,
            }),
            supabase.from('habits').update({
              current_streak: newStreak, streak_resilience_points: newResil,
              updated_at: new Date().toISOString(),
            }).eq('id', habitId).eq('user_id', user.id),
            penalty > 0 && supabase.from('commitment_fund').upsert({
              user_id: user.id, balance: currentFund.balance,
              total_earned: currentFund.total_earned, total_lost: currentFund.total_lost,
            }),
            penalty > 0 && supabase.from('commitment_transactions').insert({
              user_id: user.id, habit_id: habitId, date: today,
              amount: -penalty, reason: `Omitido: ${existing.name}`,
            }),
          ].filter(Boolean));
        });
      },

      // ── emergency mode ───────────────────────────────────────────────────
      activateEmergencyMode: () =>
        set(state => ({
          emergency_mode: true,
          habits: state.habits.map(h => ({ ...h, current_difficulty_level: 'minimum' as DifficultyLevel })),
        })),

      deactivateEmergencyMode: () => set({ emergency_mode: false }),

      // ── context ──────────────────────────────────────────────────────────
      updateBusyLevel: (level) =>
        set(state => ({ today_context: { ...state.today_context, busy_level: level } })),

      updateEnergyLevel: (level) =>
        set(state => ({ today_context: { ...state.today_context, energy_level: level } })),

      // ── habit mutations ──────────────────────────────────────────────────
      confirmEnvironmentSetup: (habitId) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, environment_setup_status: 'ready' } : h
          ),
        })),

      setHabitLevel: (habitId, level) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, current_difficulty_level: level } : h
          ),
        })),

      getSuggestedLevel: (habitId) => {
        const { habits, today_context } = get();
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return 'ideal';
        return suggestLevel(habit, today_context.busy_level, today_context.energy_level);
      },

      // ── addHabit — creates in Supabase first to get real UUID ────────────
      addHabit: async (data: Omit<Habit, 'id' | 'daily_logs' | 'current_streak' | 'best_streak' | 'streak_resilience_points' | 'current_difficulty_level'>) => {
        // 1. Insert into Supabase to get real UUID
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: created, error } = await supabase.from('habits').insert({
            user_id: user.id,
            name: data.name,
            icon: data.icon,
            category: data.category,
            color: data.color,
            schedule: data.schedule as object,
            levels: data.levels as object,
            current_difficulty_level: 'ideal',
            environment_setup_status: data.environment_setup_status ?? 'pending',
            streak_resilience_points: 50,
            current_streak: 0,
            best_streak: 0,
            commitment_contribution: data.commitment_contribution,
          }).select('id').single();

          if (!error && created) {
            const newHabit: Habit = {
              ...data,
              id: created.id,
              daily_logs: [],
              current_streak: 0,
              best_streak: 0,
              streak_resilience_points: 50,
              current_difficulty_level: 'ideal',
              environment_setup_status: data.environment_setup_status ?? 'pending',
            };
            set(state => ({ habits: [...state.habits, newHabit] }));
            return created.id;
          }
        }

        // Fallback: offline mode with local ID
        const tempId = `local_${Date.now()}`;
        const newHabit: Habit = {
          ...data,
          id: tempId,
          daily_logs: [],
          current_streak: 0,
          best_streak: 0,
          streak_resilience_points: 50,
          current_difficulty_level: 'ideal',
          environment_setup_status: data.environment_setup_status ?? 'pending',
        };
        set(state => ({ habits: [...state.habits, newHabit] }));
        return tempId;
      },

      deleteHabit: (habitId) => {
        set(state => ({ habits: state.habits.filter(h => h.id !== habitId) }));
        if (isRealId(habitId)) {
          supabase.from('habits').delete().eq('id', habitId);
        }
      },

      markSynced: () => set({ synced: true }),

      // ── load from Supabase ───────────────────────────────────────────────
      loadFromSupabase: async (userId: string) => {
        try {
          const [habitsRes, logsRes, fundRes, txRes] = await Promise.all([
            supabase.from('habits').select('*').eq('user_id', userId).order('created_at'),
            supabase.from('daily_logs').select('*').eq('user_id', userId).gte('date', getDateNDaysAgo(90)),
            supabase.from('commitment_fund').select('*').eq('user_id', userId).single(),
            supabase.from('commitment_transactions').select('*').eq('user_id', userId)
              .order('created_at', { ascending: false }).limit(50),
          ]);

          if (!habitsRes.data?.length) {
            set({ synced: true });
            return;
          }

          const habits: Habit[] = habitsRes.data.map(h => ({
            id: h.id,
            name: h.name,
            icon: h.icon,
            category: h.category as Habit['category'],
            color: h.color,
            schedule: h.schedule as Habit['schedule'],
            levels: h.levels as Habit['levels'],
            current_difficulty_level: h.current_difficulty_level as DifficultyLevel,
            environment_setup_status: h.environment_setup_status as Habit['environment_setup_status'],
            streak_resilience_points: h.streak_resilience_points,
            current_streak: h.current_streak,
            best_streak: h.best_streak,
            commitment_contribution: h.commitment_contribution,
            daily_logs: (logsRes.data ?? [])
              .filter(l => l.habit_id === h.id)
              .map(l => ({
                date: l.date,
                completed: l.completed,
                level_completed: l.level_completed as DifficultyLevel | undefined,
                emergency_mode: l.emergency_mode,
                justification: l.justification ?? undefined,
                points_earned: l.points_earned,
              })),
          }));

          const fundData = fundRes.data;
          const commitment_fund: CommitmentFund = {
            balance: fundData?.balance ?? 500,
            total_earned: fundData?.total_earned ?? 0,
            total_lost: fundData?.total_lost ?? 0,
            transactions: (txRes.data ?? []).map(t => ({
              id: t.id,
              date: t.date,
              amount: t.amount,
              reason: t.reason ?? '',
              habit_id: t.habit_id ?? undefined,
            })),
          };

          set({ habits, commitment_fund, synced: true });
        } catch (err) {
          console.error('[loadFromSupabase]', err);
          set({ synced: true }); // mark synced even on error so UI doesn't block
        }
      },
    }),
    {
      name: 'habitflow-v3',
      // Do NOT persist synced — always reload from Supabase on mount
      partialize: (state) => ({
        habits: state.habits,
        commitment_fund: state.commitment_fund,
        emergency_mode: state.emergency_mode,
        today_context: state.today_context,
      }),
    }
  )
);

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
