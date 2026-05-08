'use client';
import { motion } from 'framer-motion';
import { Battery, Calendar } from 'lucide-react';
import { BusyLevel } from '@/lib/types';
import { BUSY_LABELS } from '@/lib/resilience';
import { useHabitStore } from '@/store/habitStore';
import { cn } from '@/lib/utils';

const BUSY_OPTIONS: { value: BusyLevel; emoji: string; color: string }[] = [
  { value: 'free', emoji: '😌', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  { value: 'normal', emoji: '😊', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { value: 'busy', emoji: '😤', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'overloaded', emoji: '🥵', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
];

const ENERGY_LEVELS = [
  { min: 0, max: 25, label: 'Agotado', color: '#ef4444' },
  { min: 25, max: 50, label: 'Bajo', color: '#f97316' },
  { min: 50, max: 75, label: 'Normal', color: '#3b82f6' },
  { min: 75, max: 101, label: 'Cargado', color: '#22c55e' },
];

function getEnergyInfo(level: number) {
  return ENERGY_LEVELS.find(e => level >= e.min && level < e.max) ?? ENERGY_LEVELS[2];
}

export function ContextPanel() {
  const { today_context, updateBusyLevel, updateEnergyLevel } = useHabitStore();
  const energyInfo = getEnergyInfo(today_context.energy_level);

  return (
    <div className="rounded-2xl card-border bg-[hsl(var(--bg-card))] p-4 space-y-4">
      {/* Busy level */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[hsl(var(--text-muted))]" />
          <span className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider">
            ¿Cómo está el día?
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BUSY_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.92 }}
              onClick={() => updateBusyLevel(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors',
                today_context.busy_level === opt.value
                  ? opt.color
                  : 'border-[hsl(var(--border))] text-[hsl(var(--text-muted))] bg-transparent'
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-[10px] leading-tight text-center">
                {BUSY_LABELS[opt.value]}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Energy level */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-[hsl(var(--text-muted))]" />
            <span className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider">
              Energía
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: energyInfo.color }}>
            {energyInfo.label} · {today_context.energy_level}%
          </span>
        </div>
        <div className="relative h-2 bg-[hsl(var(--bg-elevated))] rounded-full">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ background: energyInfo.color, width: `${today_context.energy_level}%` }}
            transition={{ duration: 0.3 }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={today_context.energy_level}
            onChange={e => updateEnergyLevel(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
