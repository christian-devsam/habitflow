import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Habit } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isScheduledToday(habit: Habit): boolean {
  const dayMap: Record<string, string> = {
    Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu',
    Fri: 'fri', Sat: 'sat', Sun: 'sun',
  };
  const today = dayMap[format(new Date(), 'EEE')] as Habit['schedule']['days'][number];
  return habit.schedule.days.includes(today);
}

export function isCompletedToday(habit: Habit): boolean {
  return habit.daily_logs.some(l => l.date === todayKey() && l.completed);
}

export function isLoggedToday(habit: Habit): boolean {
  return habit.daily_logs.some(l => l.date === todayKey());
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDate(): string {
  return format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
