'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check, X, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Habit, DifficultyLevel } from '@/lib/types';
import { LEVEL_LABELS, LEVEL_COLORS } from '@/lib/resilience';
import { formatDuration, cn } from '@/lib/utils';
import { useHabitStore } from '@/store/habitStore';

interface HabitCardProps {
  habit: Habit;
  isHero?: boolean;
  suggestedLevel: DifficultyLevel;
}

const LEVEL_ORDER: DifficultyLevel[] = ['minimum', 'ideal', 'elite'];

export function HabitCard({ habit, isHero = false, suggestedLevel }: HabitCardProps) {
  const { completeHabit, skipHabit, setHabitLevel } = useHabitStore();

  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  const currentLevel = habit.current_difficulty_level;
  const levelColor = LEVEL_COLORS[currentLevel];
  const levelDuration = habit.levels[currentLevel].duration;
  const levelDesc = habit.levels[currentLevel].description;
  const isSuggested = currentLevel !== suggestedLevel;

  function cycleLevel(dir: 1 | -1) {
    const idx = LEVEL_ORDER.indexOf(currentLevel);
    const next = LEVEL_ORDER[Math.max(0, Math.min(2, idx + dir))];
    if (next !== currentLevel) setHabitLevel(habit.id, next);
  }

  async function handleComplete() {
    if (loading || done) return;
    setLoading(true);
    completeHabit(habit.id, currentLevel);
    setDone(true);
    setLoading(false);
  }

  function handleSkipConfirm() {
    skipHabit(habit.id, justification);
    setSkipped(true);
    setShowSkip(false);
  }

  // Completed animation then hide
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="rounded-2xl p-5 flex items-center justify-center gap-3"
          style={{ background: `${habit.color}20`, border: `1px solid ${habit.color}40` }}>
          <span className="text-2xl">{habit.icon}</span>
          <span className="font-semibold text-sm" style={{ color: habit.color }}>
            ✓ {habit.name} completado · +{currentLevel === 'minimum' ? 5 : currentLevel === 'ideal' ? 15 : 30} pts
          </span>
        </div>
      </motion.div>
    );
  }

  if (skipped) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'rounded-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] overflow-hidden',
          isHero && 'shadow-lg'
        )}
      >
        {/* Color accent top bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}80)` }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <span className={cn('rounded-xl leading-none', isHero ? 'text-4xl' : 'text-3xl')}>
              {habit.icon}
            </span>

            <div className="flex-1 min-w-0">
              <h3 className={cn('font-bold text-[hsl(var(--text))] leading-tight', isHero ? 'text-xl' : 'text-lg')}>
                {habit.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {habit.current_streak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs text-orange-400 font-semibold">{habit.current_streak} días</span>
                  </div>
                )}
                {habit.environment_setup_status === 'ready' && (
                  <span className="text-xs text-green-400">● Listo</span>
                )}
              </div>
            </div>

            {/* Level selector */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onPointerDown={e => { e.preventDefault(); cycleLevel(1); }}
                className="p-1 rounded-lg active:bg-[hsl(var(--bg-elevated))] transition-colors"
                aria-label="Subir nivel"
              >
                <ChevronUp className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              </button>

              <div
                className="px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide text-center min-w-[54px]"
                style={{ color: levelColor, background: `${levelColor}18`, border: `1px solid ${levelColor}35` }}
              >
                {LEVEL_LABELS[currentLevel]}
              </div>

              <button
                onPointerDown={e => { e.preventDefault(); cycleLevel(-1); }}
                className="p-1 rounded-lg active:bg-[hsl(var(--bg-elevated))] transition-colors"
                aria-label="Bajar nivel"
              >
                <ChevronDown className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              </button>
            </div>
          </div>

          {/* Level description + duration */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm text-[hsl(var(--text-muted))] leading-snug flex-1">
              {levelDesc}
            </p>
            <span className="text-sm font-mono font-semibold text-[hsl(var(--text-muted))] shrink-0">
              {formatDuration(levelDuration)}
            </span>
          </div>

          {/* Points preview */}
          <div className="flex items-center gap-1.5 mt-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400">
              +{currentLevel === 'minimum' ? 5 : currentLevel === 'ideal' ? 15 : 30} pts al completar
            </span>
            {isSuggested && (
              <button
                onPointerDown={e => { e.preventDefault(); setHabitLevel(habit.id, suggestedLevel); }}
                className="ml-auto text-xs text-blue-400 underline"
              >
                IA sugiere {LEVEL_LABELS[suggestedLevel]}
              </button>
            )}
          </div>

          {/* Resilience bar (hero only) */}
          {isHero && (
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider">Resiliencia</span>
                <span className="text-[10px] text-[hsl(var(--text-muted))]">{habit.streak_resilience_points}%</span>
              </div>
              <div className="h-1 rounded-full bg-[hsl(var(--bg-elevated))]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: levelColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${habit.streak_resilience_points}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex items-center gap-2">
          {/* COMPLETE — primary action */}
          <motion.button
            onPointerDown={e => e.preventDefault()}
            onPointerUp={handleComplete}
            disabled={loading}
            whileTap={{ scale: 0.96 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)` }}
          >
            <Check className="w-4 h-4" />
            {loading ? 'Registrando...' : 'Completar'}
          </motion.button>

          {/* SKIP — secondary action */}
          <motion.button
            onPointerDown={e => { e.preventDefault(); setShowSkip(true); }}
            whileTap={{ scale: 0.96 }}
            className="px-4 py-3 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))] text-[hsl(var(--text-muted))] text-sm font-medium flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Omitir
          </motion.button>
        </div>

        {/* Skip justification */}
        <AnimatePresence>
          {showSkip && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[hsl(var(--border))]"
            >
              <div className="p-4 space-y-3">
                <p className="text-xs text-[hsl(var(--text-muted))]">
                  Justificación (sin penalización si es válida):
                </p>
                <input
                  autoFocus
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Estoy enfermo, emergencia familiar..."
                  className="w-full bg-[hsl(var(--bg-elevated))] rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-red-500/40 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSkipConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/15 text-red-400 text-sm font-semibold border border-red-500/25 hover:bg-red-500/25 transition-colors"
                  >
                    {justification.trim().length > 8 ? 'Omitir (sin penalización)' : 'Omitir (-' + habit.commitment_contribution + ' pts)'}
                  </button>
                  <button
                    onClick={() => setShowSkip(false)}
                    className="px-4 py-2.5 rounded-xl bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))] text-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--border))] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
