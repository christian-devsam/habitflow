export type DifficultyLevel = 'minimum' | 'ideal' | 'elite';
export type HabitCategory = 'health' | 'fitness' | 'learning' | 'mindfulness' | 'productivity' | 'social';
export type EnvironmentStatus = 'pending' | 'ready' | 'skipped';
export type BusyLevel = 'free' | 'normal' | 'busy' | 'overloaded';

export interface HabitLevel {
  duration: number;
  description: string;
  points: number;
}

export interface HabitSchedule {
  time: string;
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  pre_habit_reminder: boolean;
  pre_habit_message: string;
}

export interface DailyLog {
  date: string;
  completed: boolean;
  level_completed?: DifficultyLevel;
  emergency_mode: boolean;
  justification?: string;
  points_earned: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  color: string;
  schedule: HabitSchedule;
  levels: {
    minimum: HabitLevel;
    ideal: HabitLevel;
    elite: HabitLevel;
  };
  current_difficulty_level: DifficultyLevel;
  environment_setup_status: EnvironmentStatus;
  streak_resilience_points: number;
  current_streak: number;
  best_streak: number;
  daily_logs: DailyLog[];
  commitment_contribution: number;
}

export interface CommitmentTransaction {
  id: string;
  date: string;
  amount: number;
  reason: string;
  habit_id?: string;
}

export interface CommitmentFund {
  balance: number;
  total_earned: number;
  total_lost: number;
  transactions: CommitmentTransaction[];
}

export interface TodayContext {
  busy_level: BusyLevel;
  energy_level: number;
}
