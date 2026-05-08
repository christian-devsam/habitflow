'use client';
import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Flame, CheckCircle2, X, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [showSkipInput, setShowSkipInput] = useState(false);
  const [justification, setJustification] = useState('');
  const [completed, setCompleted] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const x = useMotionValue(0);
  const controls = useAnimation();

  const bgColor = useTransform(x, [-120, 0, 120], [
    'rgba(239,68,68,0.12)', 'rgba(0,0,0,0)', 'rgba(34,197,94,0.12)'
  ]);
  const completeOpacity = useTransform(x, [0, 80, 120], [0, 0.7, 1]);
  const skipOpacity = useTransform(x, [-120, -80, 0], [1, 0.7, 0]);

  const currentLevel = habit.current_difficulty_level;
  const levelColor = LEVEL_COLORS[currentLevel];
  const levelDuration = habit.levels[currentLevel].duration;
  const levelDesc = habit.levels[currentLevel].description;
  const isSuggested = currentLevel !== suggestedLevel;

  function cycleLevel(dir: 1 | -1) {
    const idx = LEVEL_ORDER.indexOf(currentLevel);
    const next = LEVEL_ORDER[Math.max(0, Math.min(2, idx + dir))];
    setHabitLevel(habit.id, next);
  }

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    const { x: ox } = info.offset;
    if (ox > 100) {
      await controls.start({ x: 350, opacity: 0, transition: { duration: 0.3 } });
      completeHabit(habit.id, currentLevel);
      setCompleted(true);
    } else if (ox < -100) {
      await controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
      setShowSkipInput(true);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }
  }

  function handleSkipConfirm() {
    skipHabit(habit.id, justification);
    setSkipped(true);
    setShowSkipInput(false);
  }

  if (completed || skipped) return null;

  return (
    <div className="relative overflow-hidden">
      {/* Background indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <motion.div style={{ opacity: skipOpacity }}
          className="flex items-center gap-2 text-red-400 font-semibold">
          <X className="w-5 h-5" />
          <span className="text-sm">Omitir</span>
        </motion.div>
        <motion.div style={{ opacity: completeOpacity }}
          className="flex items-center gap-2 text-green-400 font-semibold">
          <span className="text-sm">Completado</span>
          <CheckCircle2 className="w-5 h-5" />
        </motion.div>
      </div>

      <motion.div
        style={{ x, backgroundColor: bgColor }}
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.15}
        dragDirectionLock
        animate={controls}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
        className={cn(
          'relative rounded-2xl card-border cursor-grab select-none',
          isHero ? 'p-5' : 'p-4',
          'bg-[hsl(var(--bg-card))]'
        )}
      >
        {/* Habit color accent bar */}
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
          style={{ background: habit.color }}
        />

        <div className="pl-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={cn('rounded-xl', isHero ? 'text-3xl' : 'text-2xl')}>
                {habit.icon}
              </span>
              <div>
                <h3 className={cn('font-semibold text-[hsl(var(--text))]', isHero ? 'text-xl' : 'text-base')}>
                  {habit.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-[hsl(var(--text-muted))]">
                    {habit.current_streak} días
                  </span>
                  {habit.environment_setup_status === 'ready' && (
                    <span className="text-xs text-green-400">● Listo</span>
                  )}
                </div>
              </div>
            </div>

            {/* Level selector */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); cycleLevel(1); }}
                className="p-0.5 rounded hover:bg-[hsl(var(--bg-elevated))] transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              </button>

              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide"
                style={{ color: levelColor, border: `1px solid ${levelColor}40`, background: `${levelColor}15` }}
              >
                {LEVEL_LABELS[currentLevel]}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); cycleLevel(-1); }}
                className="p-0.5 rounded hover:bg-[hsl(var(--bg-elevated))] transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              </button>
            </div>
          </div>

          {/* Level description */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-[hsl(var(--text-muted))] leading-snug flex-1">
              {levelDesc}
            </p>
            <span className="ml-3 text-sm font-mono font-semibold text-[hsl(var(--text-muted))]">
              {formatDuration(levelDuration)}
            </span>
          </div>

          {/* Suggestion badge */}
          {isSuggested && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="text-blue-400 text-xs">✦</span>
              <span className="text-blue-400 text-xs">
                IA sugiere: {LEVEL_LABELS[suggestedLevel]}
              </span>
              <button
                className="text-blue-300 text-xs underline"
                onClick={(e) => { e.stopPropagation(); setHabitLevel(habit.id, suggestedLevel); }}
              >
                aplicar
              </button>
            </div>
          )}

          {/* Resilience bar */}
          {isHero && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider">
                  Resiliencia
                </span>
                <span className="text-[10px] text-[hsl(var(--text-muted))]">
                  {habit.streak_resilience_points}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-[hsl(var(--bg-elevated))]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: levelColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${habit.streak_resilience_points}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
          )}

          {/* Swipe hint */}
          {isHero && (
            <div className="mt-4 flex items-center justify-between text-[10px] text-[hsl(var(--text-muted))] opacity-50">
              <span>← Omitir</span>
              <div className="w-8 h-0.5 rounded-full bg-[hsl(var(--border))]" />
              <span>Completar →</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Skip confirmation */}
      {showSkipInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-4 rounded-2xl bg-[hsl(var(--bg-elevated))] card-border"
        >
          <p className="text-sm text-[hsl(var(--text-muted))] mb-2">
            Justificación (sin penalización si es válida):
          </p>
          <input
            autoFocus
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Estoy enfermo / emergencia familiar..."
            className="w-full bg-[hsl(var(--bg-card))] rounded-xl px-3 py-2 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSkipConfirm}
              className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
            >
              Omitir
            </button>
            <button
              onClick={() => setShowSkipInput(false)}
              className="flex-1 py-2 rounded-xl bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))] text-sm font-medium hover:bg-[hsl(var(--bg-elevated))] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
