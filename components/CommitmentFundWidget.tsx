'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, Zap } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';
import { getFundHealthStatus } from '@/lib/resilience';
import { cn } from '@/lib/utils';

const HEALTH_COLORS = {
  healthy: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', bar: '#22c55e' },
  warning: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: '#f59e0b' },
  critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: '#ef4444' },
};

export function CommitmentFundWidget() {
  const { commitment_fund } = useHabitStore();
  const [expanded, setExpanded] = useState(false);

  const status = getFundHealthStatus(commitment_fund.balance);
  const colors = HEALTH_COLORS[status];
  const maxBalance = commitment_fund.total_earned || 1;
  const fillPct = Math.min(100, (commitment_fund.balance / maxBalance) * 100);

  return (
    <div className={cn('rounded-2xl card-border overflow-hidden', colors.bg, `border ${colors.border}`)}>
      <button
        className="w-full p-4 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-xl', colors.bg, `border ${colors.border}`)}>
            <Zap className={cn('w-4 h-4', colors.text)} />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider mb-0.5">
              Fondo de Compromiso
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>
                {commitment_fund.balance}
              </span>
              <span className="text-xs text-[hsl(var(--text-muted))]">pts</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+{commitment_fund.total_earned}</span>
            </div>
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <TrendingDown className="w-3 h-3" />
              <span>-{commitment_fund.total_lost}</span>
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-[hsl(var(--text-muted))]" />
          </motion.div>
        </div>
      </button>

      {/* Balance bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full bg-[hsl(var(--bg-elevated))]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: colors.bar }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Transaction history */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] pt-3 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                Últimas transacciones
              </p>
              {commitment_fund.transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--text-muted))] truncate flex-1 pr-2">
                    {tx.reason}
                  </span>
                  <span className={cn(
                    'text-xs font-mono font-semibold tabular-nums',
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
