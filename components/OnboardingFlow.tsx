'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useHabitStore } from '@/store/habitStore';
import { Habit } from '@/lib/types';

const GOALS = [
  { id: 'fitness', emoji: '💪', label: 'Salud y ejercicio' },
  { id: 'mindfulness', emoji: '🧘', label: 'Mente y bienestar' },
  { id: 'learning', emoji: '📚', label: 'Aprendizaje' },
  { id: 'productivity', emoji: '🚀', label: 'Productividad' },
  { id: 'health', emoji: '🥗', label: 'Nutrición e hidratación' },
  { id: 'social', emoji: '🤝', label: 'Relaciones' },
];

const STARTER_HABITS: Record<string, Partial<Habit>[]> = {
  fitness: [
    { name: 'Ejercicio', icon: '🏃', color: '#f97316', category: 'fitness',
      levels: { minimum: { duration: 10, description: '10 min de caminata', points: 10 }, ideal: { duration: 30, description: '30 min de cardio', points: 25 }, elite: { duration: 60, description: '1h de entrenamiento', points: 50 } },
      schedule: { time: '07:00', days: ['mon','tue','wed','thu','fri'], pre_habit_reminder: true, pre_habit_message: '¿Tienes tu ropa deportiva lista?' }, commitment_contribution: 20 },
  ],
  mindfulness: [
    { name: 'Meditación', icon: '🧘', color: '#06b6d4', category: 'mindfulness',
      levels: { minimum: { duration: 2, description: '2 min de respiración', points: 10 }, ideal: { duration: 15, description: '15 min meditación guiada', points: 25 }, elite: { duration: 45, description: '45 min práctica profunda', points: 50 } },
      schedule: { time: '06:30', days: ['mon','tue','wed','thu','fri','sat','sun'], pre_habit_reminder: false, pre_habit_message: '' }, commitment_contribution: 10 },
  ],
  learning: [
    { name: 'Lectura', icon: '📚', color: '#8b5cf6', category: 'learning',
      levels: { minimum: { duration: 5, description: '1 página del libro', points: 10 }, ideal: { duration: 30, description: '30 min lectura concentrada', points: 25 }, elite: { duration: 60, description: '1h con notas', points: 50 } },
      schedule: { time: '21:00', days: ['mon','tue','wed','thu','fri','sat','sun'], pre_habit_reminder: false, pre_habit_message: '' }, commitment_contribution: 15 },
  ],
  productivity: [
    { name: 'Planificación diaria', icon: '📋', color: '#3b82f6', category: 'productivity',
      levels: { minimum: { duration: 3, description: 'Escribir las 3 tareas del día', points: 10 }, ideal: { duration: 15, description: 'Planificación completa del día', points: 25 }, elite: { duration: 30, description: 'Revisión semanal + plan del día', points: 50 } },
      schedule: { time: '08:00', days: ['mon','tue','wed','thu','fri'], pre_habit_reminder: false, pre_habit_message: '' }, commitment_contribution: 15 },
  ],
  health: [
    { name: 'Hidratación', icon: '💧', color: '#22d3ee', category: 'health',
      levels: { minimum: { duration: 1, description: 'Beber 1 vaso grande', points: 10 }, ideal: { duration: 5, description: '8 vasos durante el día', points: 25 }, elite: { duration: 5, description: '3L + registro completo', points: 50 } },
      schedule: { time: '09:00', days: ['mon','tue','wed','thu','fri','sat','sun'], pre_habit_reminder: false, pre_habit_message: '' }, commitment_contribution: 5 },
  ],
  social: [
    { name: 'Conexión social', icon: '💬', color: '#ec4899', category: 'social',
      levels: { minimum: { duration: 5, description: 'Enviar un mensaje a alguien', points: 10 }, ideal: { duration: 20, description: 'Llamada o café con alguien', points: 25 }, elite: { duration: 60, description: 'Actividad social significativa', points: 50 } },
      schedule: { time: '19:00', days: ['mon','wed','fri','sat'], pre_habit_reminder: false, pre_habit_message: '' }, commitment_contribution: 10 },
  ],
};

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, setOnboardingCompleted } = useAuthStore();
  const { addHabit } = useHabitStore();

  function toggleGoal(id: string) {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  async function finish() {
    setLoading(true);
    try {
      if (user) {
        // Save name
        await supabase.from('profiles').update({
          name, onboarding_completed: true
        }).eq('id', user.id);

        // Create starter habits for selected goals (sequential to avoid race conditions)
        for (const goalId of selectedGoals) {
          const templates = STARTER_HABITS[goalId] ?? [];
          for (const template of templates) {
            await addHabit(template as Parameters<typeof addHabit>[0]);
          }
        }
      }
      setOnboardingCompleted(true);
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="text-center px-6">
      <div className="text-6xl mb-4">🌊</div>
      <h2 className="text-2xl font-bold text-[hsl(var(--text))] mb-3">Bienvenido a HabitFlow</h2>
      <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed mb-8">
        No somos un checklist. Somos un <strong className="text-[hsl(var(--text))]">gestor de fricción</strong>.
        Tus hábitos se adaptan a tu día, no al revés.
      </p>
      <div className="space-y-3 text-left mb-8">
        {[
          ['🎯', 'Hábitos Elásticos', 'Mínimo, Ideal o Elite según tu día'],
          ['🧠', 'Coach IA', 'Análisis personalizado con inteligencia artificial'],
          ['📅', 'Contexto automático', 'Se sincroniza con tu calendario'],
        ].map(([emoji, title, desc]) => (
          <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--bg-elevated))]">
            <span className="text-xl">{emoji}</span>
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--text))]">{title}</p>
              <p className="text-xs text-[hsl(var(--text-muted))]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setStep(1)}
        className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2">
        Empezar <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>,

    // Step 1: Name
    <motion.div key="name" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="px-6">
      <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-2">¿Cómo te llamas?</h2>
      <p className="text-[hsl(var(--text-muted))] text-sm mb-6">Tu coach IA te llamará por tu nombre.</p>
      <input
        autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
        placeholder="Tu nombre"
        className="w-full bg-[hsl(var(--bg-elevated))] rounded-2xl px-4 py-4 text-lg text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors mb-6"
      />
      <button onClick={() => setStep(2)} disabled={!name.trim()}
        className="w-full py-3.5 rounded-2xl bg-blue-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
        Continuar <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>,

    // Step 2: Goals
    <motion.div key="goals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="px-6">
      <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-1">¿Qué quieres mejorar, {name}?</h2>
      <p className="text-[hsl(var(--text-muted))] text-sm mb-5">Elige hasta 3 áreas. Crearemos hábitos personalizados.</p>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {GOALS.map(g => {
          const selected = selectedGoals.includes(g.id);
          return (
            <button key={g.id} onClick={() => toggleGoal(g.id)}
              className={cn('p-4 rounded-2xl border text-left transition-all',
                selected ? 'border-blue-500/60 bg-blue-500/15' : 'border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))]')}>
              <div className="text-2xl mb-1">{g.emoji}</div>
              <p className={cn('text-xs font-semibold', selected ? 'text-blue-300' : 'text-[hsl(var(--text-muted))]')}>
                {g.label}
              </p>
              {selected && <Check className="w-3 h-3 text-blue-400 mt-1" />}
            </button>
          );
        })}
      </div>
      <button onClick={finish} disabled={selectedGoals.length === 0 || loading}
        className="w-full py-3.5 rounded-2xl bg-blue-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <><span>Crear mis hábitos</span><ArrowRight className="w-4 h-4" /></>
        }
      </button>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(var(--bg))] flex flex-col justify-center py-12 max-w-md mx-auto">
      {/* Progress */}
      <div className="flex gap-1.5 px-6 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('h-1 rounded-full flex-1 transition-all duration-500',
            i <= step ? 'bg-blue-500' : 'bg-[hsl(var(--border))]')} />
        ))}
      </div>
      <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
    </div>
  );
}

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ');
}
