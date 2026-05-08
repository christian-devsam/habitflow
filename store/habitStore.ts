'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, CommitmentFund, TodayContext, DifficultyLevel, BusyLevel } from '@/lib/types';
import { suggestLevel, calculateResiliencePoints } from '@/lib/resilience';
import { todayKey } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface HabitStore {
  habits: Habit[];
  commitment_fund: CommitmentFund;
  emergency_mode: boolean;
  today_context: TodayContext;
  synced: boolean;

  // Core actions
  completeHabit: (habitId: string, level: DifficultyLevel, justification?: string) => void;
  skipHabit: (habitId: string, justification: string) => void;
  activateEmergencyMode: () => void;
  deactivateEmergencyMode: () => void;
  updateBusyLevel: (level: BusyLevel) => void;
  updateEnergyLevel: (level: number) => void;
  confirmEnvironmentSetup: (habitId: string) => void;
  setHabitLevel: (habitId: string, level: DifficultyLevel) => void;
  getSuggestedLevel: (habitId: string) => DifficultyLevel;
  addHabit: (data: Omit<Habit, 'id' | 'daily_logs' | 'current_streak' | 'best_streak' | 'streak_resilience_points' | 'current_difficulty_level' | 'environment_setup_status'>) => void;
  deleteHabit: (habitId: string) => void;

  // Supabase sync
  loadFromSupabase: (userId: string) => Promise<void>;
  syncHabitToSupabase: (habit: Habit, userId: string) => Promise<void>;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      commitment_fund: { balance: 500, total_earned: 0, total_lost: 0, transactions: [] },
      emergency_mode: false,
      today_context: { busy_level: 'normal', energy_level: 70 },
      synced: false,

      completeHabit: (habitId, level, justification) => {
        const { habits, emergency_mode } = get();
        const today = todayKey();

        set(state => {
          const updatedHabits = state.habits.map(habit => {
            if (habit.id !== habitId) return habit;
            if (habit.daily_logs.some(l => l.date === today)) return habit;

            const pts = calculateResiliencePoints(level, habit.current_streak, emergency_mode);
            const newStreak = habit.current_streak + 1;

            return {
              ...habit,
              daily_logs: [...habit.daily_logs, {
                date: today, completed: true, level_completed: level,
                emergency_mode, justification, points_earned: pts,
              }],
              current_streak: newStreak,
              best_streak: Math.max(habit.best_streak, newStreak),
              streak_resilience_points: Math.min(100, habit.streak_resilience_points + Math.round(pts / 5)),
              current_difficulty_level: level,
            };
          });

          const habit = habits.find(h => h.id === habitId)!;
          const fundGain = level === 'minimum' ? 5 : level === 'ideal' ? 15 : 30;
          const tx = { id: `${Date.now()}`, date: today, amount: fundGain,
            reason: `Completado: ${habit?.name} (${level})`, habit_id: habitId };

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

        // Async Supabase sync
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          const updated = get().habits.find(h => h.id === habitId);
          if (updated) get().syncHabitToSupabase(updated, user.id);

          const fundGain = level === 'minimum' ? 5 : level === 'ideal' ? 15 : 30;
          supabase.from('daily_logs').upsert({
            habit_id: habitId, user_id: user.id, date: today,
            completed: true, level_completed: level, emergency_mode,
            justification, points_earned: calculateResiliencePoints(level, 0, emergency_mode),
          });
          supabase.from('commitment_fund').upsert({
            user_id: user.id,
            balance: get().commitment_fund.balance,
            total_earned: get().commitment_fund.total_earned,
            total_lost: get().commitment_fund.total_lost,
          });
          supabase.from('commitment_transactions').insert({
            user_id: user.id, habit_id: habitId, date: today,
            amount: fundGain, reason: `Completado: ${get().habits.find(h=>h.id===habitId)?.name} (${level})`,
          });
        });
      },

      skipHabit: (habitId, justification) => {
        const today = todayKey();
        set(state => {
          const isJustified = justification.trim().length > 8;
          const habit = state.habits.find(h => h.id === habitId)!;
          const penalty = isJustified ? 0 : (habit?.commitment_contribution ?? 10);

          const updatedHabits = state.habits.map(h => {
            if (h.id !== habitId) return h;
            if (h.daily_logs.some(l => l.date === today)) return h;
            return {
              ...h,
              daily_logs: [...h.daily_logs, {
                date: today, completed: false,
                emergency_mode: state.emergency_mode, justification, points_earned: -penalty,
              }],
              current_streak: isJustified ? h.current_streak : 0,
              streak_resilience_points: Math.max(0, h.streak_resilience_points - (isJustified ? 0 : 15)),
            };
          });

          const txList = penalty > 0
            ? [{ id: `${Date.now()}`, date: today, amount: -penalty,
                reason: `Omitido: ${habit?.name}`, habit_id: habitId },
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
      },

      activateEmergencyMode: () =>
        set(state => ({
          emergency_mode: true,
          habits: state.habits.map(h => ({ ...h, current_difficulty_level: 'minimum' as DifficultyLevel })),
        })),

      deactivateEmergencyMode: () => set({ emergency_mode: false }),

      updateBusyLevel: (level) =>
        set(state => ({ today_context: { ...state.today_context, busy_level: level } })),

      updateEnergyLevel: (level) =>
        set(state => ({ today_context: { ...state.today_context, energy_level: level } })),

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

      addHabit: (data) => {
        const newHabit: Habit = {
          ...data,
          id: `local_${Date.now()}`,
          daily_logs: [],
          current_streak: 0,
          best_streak: 0,
          streak_resilience_points: 50,
          current_difficulty_level: 'ideal',
          environment_setup_status: 'pending',
        };
        set(state => ({ habits: [...state.habits, newHabit] }));

        // Sync to Supabase
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          get().syncHabitToSupabase(newHabit, user.id);
        });
      },

      deleteHabit: (habitId) => {
        set(state => ({ habits: state.habits.filter(h => h.id !== habitId) }));
        supabase.from('habits').delete().eq('id', habitId);
      },

      // Load all data from Supabase (called on login)
      loadFromSupabase: async (userId: string) => {
        const [habitsRes, logsRes, fundRes, txRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', userId).order('sort_order'),
          supabase.from('daily_logs').select('*').eq('user_id', userId),
          supabase.from('commitment_fund').select('*').eq('user_id', userId).single(),
          supabase.from('commitment_transactions').select('*').eq('user_id', userId)
            .order('created_at', { ascending: false }).limit(50),
        ]);

        if (!habitsRes.data?.length) { set({ synced: true }); return; }

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

        const fund = fundRes.data;
        const commitment_fund: CommitmentFund = {
          balance: fund?.balance ?? 500,
          total_earned: fund?.total_earned ?? 0,
          total_lost: fund?.total_lost ?? 0,
          transactions: (txRes.data ?? []).map(t => ({
            id: t.id,
            date: t.date,
            amount: t.amount,
            reason: t.reason ?? '',
            habit_id: t.habit_id ?? undefined,
          })),
        };

        set({ habits, commitment_fund, synced: true });
      },

      syncHabitToSupabase: async (habit: Habit, userId: string) => {
        await supabase.from('habits').upsert({
          id: habit.id.startsWith('local_') ? undefined : habit.id,
          user_id: userId,
          name: habit.name,
          icon: habit.icon,
          category: habit.category,
          color: habit.color,
          schedule: habit.schedule as object,
          levels: habit.levels as object,
          current_difficulty_level: habit.current_difficulty_level,
          environment_setup_status: habit.environment_setup_status,
          streak_resilience_points: habit.streak_resilience_points,
          current_streak: habit.current_streak,
          best_streak: habit.best_streak,
          commitment_contribution: habit.commitment_contribution,
          updated_at: new Date().toISOString(),
        });
      },
    }),
    { name: 'habitflow-v2' }
  )
);
