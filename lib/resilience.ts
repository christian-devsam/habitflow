import { DifficultyLevel, Habit, BusyLevel } from './types';
import { format, subDays } from 'date-fns';

const DAY_KEYS: Record<string, string> = {
  Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu',
  Fri: 'fri', Sat: 'sat', Sun: 'sun',
};

export function getRecentSuccessRate(habit: Habit, days = 7): number {
  const today = new Date();
  let completed = 0;
  let scheduled = 0;

  for (let i = 1; i <= days; i++) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayKey = DAY_KEYS[format(d, 'EEE')] as Habit['schedule']['days'][number];

    if (habit.schedule.days.includes(dayKey)) {
      scheduled++;
      const log = habit.daily_logs.find(l => l.date === dateStr);
      if (log?.completed) completed++;
    }
  }

  return scheduled === 0 ? 1 : completed / scheduled;
}

export function suggestLevel(
  habit: Habit,
  busyLevel: BusyLevel,
  energyLevel: number
): DifficultyLevel {
  const rate = getRecentSuccessRate(habit);

  if (busyLevel === 'overloaded' || energyLevel < 20) return 'minimum';
  if (busyLevel === 'busy' || energyLevel < 40) return rate > 0.8 ? 'ideal' : 'minimum';

  if (rate < 0.5) return 'minimum';
  if (rate < 0.75) return 'ideal';
  return 'elite';
}

export function calculateResiliencePoints(
  level: DifficultyLevel,
  streakDays: number,
  emergencyMode: boolean
): number {
  const base = { minimum: 10, ideal: 25, elite: 50 }[level];
  const bonus = Math.min(streakDays * 2, 30);
  return Math.round((base + bonus) * (emergencyMode ? 0.5 : 1));
}

export function getStreakResilienceScore(habit: Habit): number {
  const recent = habit.daily_logs.slice(-30);
  const total = recent.filter(l => l.completed).length;
  if (total === 0) return habit.streak_resilience_points;
  const minCompletions = recent.filter(l => l.level_completed === 'minimum').length;
  return Math.round((minCompletions / total) * 100);
}

export function getFundHealthStatus(balance: number): 'healthy' | 'warning' | 'critical' {
  if (balance >= 300) return 'healthy';
  if (balance >= 100) return 'warning';
  return 'critical';
}

export const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  minimum: 'Mínimo',
  ideal: 'Ideal',
  elite: 'Elite',
};

export const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  minimum: '#64748b',
  ideal: '#3b82f6',
  elite: '#f59e0b',
};

export const BUSY_LABELS: Record<string, string> = {
  free: 'Día libre',
  normal: 'Normal',
  busy: 'Día cargado',
  overloaded: 'Sobrecargado',
};
