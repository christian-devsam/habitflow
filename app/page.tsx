'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, LogOut, Plus } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/authStore';
import { isScheduledToday, isCompletedToday, formatDate, cn } from '@/lib/utils';
import { HabitCard } from '@/components/HabitCard';
import { CommitmentFundWidget } from '@/components/CommitmentFundWidget';
import { EmergencyModeButton } from '@/components/EmergencyModeButton';
import { ContextPanel } from '@/components/ContextPanel';
import { PreHabitReminder } from '@/components/PreHabitReminder';
import { DailyProgress } from '@/components/DailyProgress';
import { AICoachPanel } from '@/components/AICoachPanel';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { CalendarSync } from '@/components/CalendarSync';
import { PushSetup } from '@/components/PushSetup';
import { Habit } from '@/lib/types';

export default function HomePage() {
  const { habits, emergency_mode, getSuggestedLevel, addHabit, loadFromSupabase, synced } = useHabitStore();
  const { user, loading, onboardingCompleted, signOut } = useAuthStore();

  const [showContext, setShowContext] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Load from Supabase when user logs in
  useEffect(() => {
    if (user && !synced) loadFromSupabase(user.id);
  }, [user, synced]);

  // Show onboarding for new users
  useEffect(() => {
    if (user && !loading && !onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user, loading, onboardingCompleted]);

  // Handle calendar connection callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const todayHabits = useMemo(() => habits.filter(isScheduledToday), [habits]);
  const pending = useMemo(() => todayHabits.filter(h => !isCompletedToday(h)), [todayHabits]);
  const completed = useMemo(() => todayHabits.filter(isCompletedToday), [todayHabits]);

  const heroHabit = pending[0];
  const queueHabits = pending.slice(1);
  const allDone = todayHabits.length > 0 && pending.length === 0;

  function handleCreateHabit(habitData: object) {
    const data = habitData as Omit<Habit, 'id' | 'daily_logs' | 'current_streak' | 'best_streak' | 'streak_resilience_points' | 'current_difficulty_level' | 'environment_setup_status'>;
    addHabit(data);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🌊</div>
          <p className="text-[hsl(var(--text-muted))] text-sm">Cargando HabitFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      <div className={cn('min-h-screen pb-28 transition-colors duration-500', emergency_mode && 'pt-10')}>
        <EmergencyModeButton />
        <AICoachPanel onCreateHabit={handleCreateHabit} />

        {/* Header */}
        <header className="px-4 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1 capitalize">
                {formatDate()}
              </p>
              <h1 className="text-2xl font-bold text-[hsl(var(--text))]">
                {allDone ? '¡Todo listo! 🎯'
                  : heroHabit ? 'Siguiente acción'
                  : habits.length === 0 ? 'Empieza aquí'
                  : 'Sin hábitos hoy'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowContext(v => !v)}
                className={cn('p-2 rounded-xl border transition-colors',
                  showContext
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))]')}>
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={() => setShowMenu(v => !v)}
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.user_metadata?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
              </button>
            </div>
          </div>

          {/* User menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-4 top-16 z-30 bg-[hsl(var(--bg-elevated))] rounded-2xl border border-[hsl(var(--border))] py-2 min-w-[160px] shadow-xl">
                <p className="px-4 py-1 text-xs text-[hsl(var(--text-muted))] truncate max-w-[200px]">
                  {user?.email}
                </p>
                <hr className="border-[hsl(var(--border))] my-1" />
                <button onClick={() => { signOut(); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          {todayHabits.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              {todayHabits.map(h => (
                <div key={h.id}
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
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                <div className="space-y-3">
                  <ContextPanel />
                  <CalendarSync />
                  <PushSetup />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Commitment fund */}
          <CommitmentFundWidget />

          {/* Pre-habit reminders */}
          <PreHabitReminder habits={todayHabits} />

          {/* Empty state */}
          {habits.length === 0 && !showOnboarding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-12 text-center">
              <div className="text-5xl mb-4">🌱</div>
              <h2 className="text-lg font-bold text-[hsl(var(--text))] mb-2">Sin hábitos todavía</h2>
              <p className="text-[hsl(var(--text-muted))] text-sm mb-6">
                Usa el Coach IA para crear tu primer hábito o reinicia el onboarding
              </p>
              <button onClick={() => setShowOnboarding(true)}
                className="mx-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-semibold">
                <Plus className="w-4 h-4" />
                Crear mis hábitos
              </button>
            </motion.div>
          )}

          {/* All done */}
          {allDone && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="py-10 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-1">¡Día completado!</h2>
              <p className="text-[hsl(var(--text-muted))] text-sm">
                Todos los hábitos de hoy están listos. El camino se construye paso a paso.
              </p>
            </motion.div>
          )}

          {/* Hero habit */}
          {heroHabit && (
            <motion.div key={heroHabit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <HabitCard habit={heroHabit} isHero suggestedLevel={getSuggestedLevel(heroHabit.id)} />
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
                  <motion.div key={habit.id} initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <HabitCard habit={habit} suggestedLevel={getSuggestedLevel(habit.id)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <button onClick={() => setShowCompleted(v => !v)}
                className="flex items-center gap-2 w-full text-left py-2">
                <span className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider">
                  Completados · {completed.length}
                </span>
                <motion.div animate={{ rotate: showCompleted ? 180 : 0 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                </motion.div>
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <DailyProgress completed={completed} total={todayHabits.length} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom safe area */}
        <div className="h-4" />
      </div>
    </>
  );
}
