'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';

export function EmergencyModeButton() {
  const { emergency_mode, activateEmergencyMode, deactivateEmergencyMode } = useHabitStore();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleActivate() {
    activateEmergencyMode();
    setShowConfirm(false);
  }

  if (emergency_mode) {
    return (
      <>
        {/* Fullscreen emergency overlay border */}
        <div className="fixed inset-0 pointer-events-none z-10"
          style={{ boxShadow: 'inset 0 0 0 3px rgba(239,68,68,0.5)' }} />

        {/* Banner */}
        <motion.div
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto"
        >
          <div className="glow-red mx-0 bg-red-950/90 border-b border-red-500/40 px-4 py-2.5 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-red-300 text-sm font-semibold">Modo Emergencia activo</span>
              <span className="text-red-400/70 text-xs">· todos los hábitos al mínimo</span>
            </div>
            <button
              onClick={deactivateEmergencyMode}
              className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      {/* Fixed emergency button */}
      <motion.button
        className="fixed bottom-6 right-4 z-40 max-w-md"
        style={{ right: 'calc(50% - 200px + 16px)' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setShowConfirm(true)}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-950/80 border border-red-500/40 backdrop-blur-md text-red-300 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Día terrible</span>
          </div>
        </div>
      </motion.button>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="w-full max-w-md bg-[hsl(var(--bg-card))] rounded-3xl p-6 border border-red-500/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🆘</div>
                <h2 className="text-xl font-bold text-[hsl(var(--text))] mb-2">
                  Modo Emergencia
                </h2>
                <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed">
                  Todos tus hábitos se reducen al nivel <strong className="text-[hsl(var(--text))]">mínimo</strong> para hoy.
                  Tu racha está a salvo. Mañana vuelves al ritmo normal.
                </p>
              </div>

              <div className="space-y-2 mb-5 p-4 rounded-2xl bg-[hsl(var(--bg-elevated))]">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-[hsl(var(--text-muted))]">Rachas protegidas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-[hsl(var(--text-muted))]">Puntos reducidos al 50%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-[hsl(var(--text-muted))]">Sin penalización por omisión</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleActivate}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
                >
                  Activar
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))] font-medium text-sm hover:bg-[hsl(var(--border))] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
