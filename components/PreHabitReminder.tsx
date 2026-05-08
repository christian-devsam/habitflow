'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { Habit } from '@/lib/types';
import { useHabitStore } from '@/store/habitStore';

interface PreHabitReminderProps {
  habits: Habit[];
}

export function PreHabitReminder({ habits }: PreHabitReminderProps) {
  const { confirmEnvironmentSetup } = useHabitStore();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const pendingReminders = habits.filter(
    h => h.schedule.pre_habit_reminder &&
         h.environment_setup_status === 'pending' &&
         !dismissed.includes(h.id)
  );

  if (pendingReminders.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">
          Preparación de entorno
        </span>
      </div>

      <AnimatePresence>
        {pendingReminders.map(habit => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <span className="text-xl mt-0.5">{habit.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-amber-200 leading-snug">
                {habit.schedule.pre_habit_message}
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                Para {habit.name} a las {habit.schedule.time}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => confirmEnvironmentSetup(habit.id)}
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                title="Listo"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={() => setDismissed(d => [...d, habit.id])}
                className="p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                title="Descartar"
              >
                <X className="w-4 h-4 text-amber-400/50" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
