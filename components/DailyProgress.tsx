'use client';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Habit } from '@/lib/types';
import { LEVEL_COLORS, LEVEL_LABELS } from '@/lib/resilience';

interface DailyProgressProps {
  completed: Habit[];
  total: number;
}

export function DailyProgress({ completed, total }: DailyProgressProps) {
  if (completed.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <span className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider">
          Completados hoy · {completed.length}/{total}
        </span>
      </div>

      <div className="space-y-2">
        {completed.map((habit, i) => {
          const todayLog = habit.daily_logs[habit.daily_logs.length - 1];
          const level = todayLog?.level_completed ?? habit.current_difficulty_level;
          const color = LEVEL_COLORS[level];

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--bg-card))] border border-green-500/15"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.icon}</span>
                <div>
                  <span className="text-sm text-[hsl(var(--text))]">{habit.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color }}>
                      {LEVEL_LABELS[level]}
                    </span>
                    <span className="text-xs text-[hsl(var(--text-muted))]">
                      +{todayLog?.points_earned ?? 0} pts
                    </span>
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
