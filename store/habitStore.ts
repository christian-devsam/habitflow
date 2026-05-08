'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, CommitmentFund, TodayContext, DifficultyLevel, BusyLevel } from '@/lib/types';
import { suggestLevel, calculateResiliencePoints } from '@/lib/resilience';
import { todayKey } from '@/lib/utils';

const SEED_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Ejercicio',
    icon: '🏃',
    category: 'fitness',
    color: '#f97316',
    schedule: {
      time: '07:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      pre_habit_reminder: true,
      pre_habit_message: '¿Tienes tu ropa deportiva lista para mañana?',
    },
    levels: {
      minimum: { duration: 10, description: '10 min de caminata rápida', points: 10 },
      ideal: { duration: 30, description: '30 min de cardio + fuerza', points: 25 },
      elite: { duration: 60, description: '1h de entrenamiento completo', points: 50 },
    },
    current_difficulty_level: 'ideal',
    environment_setup_status: 'ready',
    streak_resilience_points: 85,
    current_streak: 5,
    best_streak: 12,
    daily_logs: [],
    commitment_contribution: 20,
  },
  {
    id: '2',
    name: 'Lectura',
    icon: '📚',
    category: 'learning',
    color: '#8b5cf6',
    schedule: {
      time: '21:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      pre_habit_reminder: false,
      pre_habit_message: '',
    },
    levels: {
      minimum: { duration: 5, description: '1 página del libro actual', points: 10 },
      ideal: { duration: 30, description: '30 min de lectura concentrada', points: 25 },
      elite: { duration: 60, description: '1h+ con notas y reflexiones', points: 50 },
    },
    current_difficulty_level: 'ideal',
    environment_setup_status: 'pending',
    streak_resilience_points: 60,
    current_streak: 3,
    best_streak: 21,
    daily_logs: [],
    commitment_contribution: 15,
  },
  {
    id: '3',
    name: 'Meditación',
    icon: '🧘',
    category: 'mindfulness',
    color: '#06b6d4',
    schedule: {
      time: '06:30',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      pre_habit_reminder: true,
      pre_habit_message: '¿Tu espacio de meditación está listo para mañana?',
    },
    levels: {
      minimum: { duration: 2, description: '2 min de respiración consciente', points: 10 },
      ideal: { duration: 15, description: '15 min de meditación guiada', points: 25 },
      elite: { duration: 45, description: '45 min de práctica profunda', points: 50 },
    },
    current_difficulty_level: 'ideal',
    environment_setup_status: 'ready',
    streak_resilience_points: 92,
    current_streak: 14,
    best_streak: 30,
    daily_logs: [],
    commitment_contribution: 10,
  },
  {
    id: '4',
    name: 'Hidratación',
    icon: '💧',
    category: 'health',
    color: '#22d3ee',
    schedule: {
      time: '09:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      pre_habit_reminder: false,
      pre_habit_message: '',
    },
    levels: {
      minimum: { duration: 2, description: 'Beber 1 vaso grande de agua', points: 10 },
      ideal: { duration: 10, description: '8 vasos distribuidos en el día', points: 25 },
      elite: { duration: 10, description: '3L + electrolitos y registro', points: 50 },
    },
    current_difficulty_level: 'ideal',
    environment_setup_status: 'ready',
    streak_resilience_points: 70,
    current_streak: 7,
    best_streak: 45,
    daily_logs: [],
    commitment_contribution: 5,
  },
];

interface HabitStore {
  habits: Habit[];
  commitment_fund: CommitmentFund;
  emergency_mode: boolean;
  today_context: TodayContext;

  completeHabit: (habitId: string, level: DifficultyLevel, justification?: string) => void;
  skipHabit: (habitId: string, justification: string) => void;
  activateEmergencyMode: () => void;
  deactivateEmergencyMode: () => void;
  updateBusyLevel: (level: BusyLevel) => void;
  updateEnergyLevel: (level: number) => void;
  confirmEnvironmentSetup: (habitId: string) => void;
  setHabitLevel: (habitId: string, level: DifficultyLevel) => void;
  getSuggestedLevel: (habitId: string) => DifficultyLevel;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: SEED_HABITS,
      commitment_fund: {
        balance: 500,
        total_earned: 850,
        total_lost: 350,
        transactions: [
          { id: 'seed1', date: '2026-05-06', amount: 25, reason: 'Completado: Ejercicio (ideal)' },
          { id: 'seed2', date: '2026-05-06', amount: 25, reason: 'Completado: Lectura (ideal)' },
          { id: 'seed3', date: '2026-05-05', amount: -20, reason: 'Omitido sin justificación: Ejercicio' },
          { id: 'seed4', date: '2026-05-05', amount: 10, reason: 'Completado: Meditación (mínimo)' },
        ],
      },
      emergency_mode: false,
      today_context: { busy_level: 'normal', energy_level: 70 },

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
              daily_logs: [
                ...habit.daily_logs,
                { date: today, completed: true, level_completed: level, emergency_mode, justification, points_earned: pts },
              ],
              current_streak: newStreak,
              best_streak: Math.max(habit.best_streak, newStreak),
              streak_resilience_points: Math.min(100, habit.streak_resilience_points + Math.round(pts / 5)),
              current_difficulty_level: level,
            };
          });

          const habit = habits.find(h => h.id === habitId)!;
          const fundGain = level === 'minimum' ? 5 : level === 'ideal' ? 15 : 30;
          const tx = {
            id: `${Date.now()}`,
            date: today,
            amount: fundGain,
            reason: `Completado: ${habit.name} (${level})`,
            habit_id: habitId,
          };

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
      },

      skipHabit: (habitId, justification) => {
        const today = todayKey();
        set(state => {
          const isJustified = justification.trim().length > 8;
          const habit = state.habits.find(h => h.id === habitId)!;
          const penalty = isJustified ? 0 : habit.commitment_contribution;

          const updatedHabits = state.habits.map(h => {
            if (h.id !== habitId) return h;
            if (h.daily_logs.some(l => l.date === today)) return h;
            return {
              ...h,
              daily_logs: [...h.daily_logs, {
                date: today, completed: false,
                emergency_mode: state.emergency_mode,
                justification, points_earned: -penalty,
              }],
              current_streak: isJustified ? h.current_streak : 0,
              streak_resilience_points: Math.max(0, h.streak_resilience_points - (isJustified ? 0 : 15)),
            };
          });

          const txList = penalty > 0 ? [
            {
              id: `${Date.now()}`,
              date: today,
              amount: -penalty,
              reason: `Omitido: ${habit.name}`,
              habit_id: habitId,
            },
            ...state.commitment_fund.transactions,
          ].slice(0, 50) : state.commitment_fund.transactions;

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
    }),
    { name: 'habitflow-v1' }
  )
);
