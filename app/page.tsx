'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';
import { isScheduledToday, isCompletedToday, formatDate, cn } from '@/lib/utils';
import { HabitCard } from '@/components/HabitCard';
import { CommitmentFundWidget } from '@/components/CommitmentFundWidget';
import { EmergencyModeButton } from '@/components/EmergencyModeButton';
import { ContextPanel } from '@/components/ContextPanel';
import { PreHabitReminder } from '@/components/PreHabitReminder';
import { DailyProgress } from '@/components/DailyProgress';

export default function HomePage() {
  const { habits, emergency_mode, getSuggestedLevel } = useHabitStore();
  const [showContext, setShowContext] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const todayHabits = useMemo(() => habits.filter(isScheduledToday), [habits]);
  const pending = useMemo(() => todayHabits.filter(h => !isCompletedToday(h)), [todayHabits]);
  const completed = useMemo(() => todayHabits.filter(isCompletedToday), [todayHabits]);

  const heroHabit = pending[0];
  const queueHabits = pending.slice(1);
  const allDone = todayHabits.length > 0 && pending.length === 0;

  const dateStr = formatDate();

  return (
    <div className={cn(
      'min-h-screen pb-24 transition-colors duration-500',
      emergency_mode && 'pt-10'
    )}>
      <EmergencyModeButton />

      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1">
              {dateStr}
            </p>
            <h1 className="text-2xl font-bold text-[hsl(var(--text))]">
              {allDone ? '¡Todo listo!' : heroHabit ? 'Siguiente acción' : 'Sin hábitos hoy'}
            </h1>
          </div>
          <button
            onClick={() => setShowContext(v => !v)}
            className={cn(
              'p-2 rounded-xl border transition-colors',
              showContext
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))]'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        {todayHabits.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {todayHabits.map(h => (
              <div
                key={h.id}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: isCompletedToday(h) ? h.color : 'hsl(var(--border))',
                  width: isCompletedToday(h) ? '24px' : '8px',
                }}
              />
            ))}
            <span className="text-xs text-[hsl(var(--text-muted))] ml-1">
              {completed.length}/{todayHabits.length}
            </span>
          </div>
        )}
      </header>

      <div className="px-4 space-y-3">
        {/* Context panel */}
        <AnimatePresence>
          {showContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ContextPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Commitment fund */}
        <CommitmentFundWidget />

        {/* Pre-habit reminders */}
        <PreHabitReminder habits={todayHabits} />

        {/* All done state */}
        {allDone && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-2">
              Día completado
            </h2>
            <p className="text-[hsl(var(--text-muted))] text-sm">
              Todos los hábitos de hoy están listos. ¡Gran trabajo!
            </p>
          </motion.div>
        )}

        {/* Hero habit */}
        {heroHabit && (
          <motion.div
            key={heroHabit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HabitCard
              habit={heroHabit}
              isHero
              suggestedLevel={getSuggestedLevel(heroHabit.id)}
            />
          </motion.div>
        )}

        {/* Queue */}
        {queueHabits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider px-1">
              En cola · {queueHabits.length}
            </p>
            <AnimatePresence>
              {queueHabits.map((habit, i) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <HabitCard
                    habit={habit}
                    suggestedLevel={getSuggestedLevel(habit.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Completed section */}
        {completed.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-2 w-full text-left py-2"
            >
              <span className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider">
                Completados · {completed.length}
              </span>
              <motion.div animate={{ rotate: showCompleted ? 180 : 0 }}>
                <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <DailyProgress completed={completed} total={todayHabits.length} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
