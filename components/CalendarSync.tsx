'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useHabitStore } from '@/store/habitStore';
import { BUSY_LABELS } from '@/lib/resilience';
import { cn } from '@/lib/utils';

export function CalendarSync() {
  const { user } = useAuthStore();
  const { updateBusyLevel, today_context } = useHabitStore();
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (user) checkConnection();
  }, [user]);

  async function checkConnection() {
    const { data } = await supabase
      .from('user_context')
      .select('google_access_token, google_token_expiry')
      .eq('user_id', user!.id)
      .single();

    if (data?.google_access_token) {
      setConnected(true);
      syncCalendar(data.google_access_token);
    }
  }

  async function syncCalendar(token?: string) {
    if (!user) return;
    setSyncing(true);
    try {
      let accessToken = token;
      if (!accessToken) {
        const { data } = await supabase
          .from('user_context')
          .select('google_access_token')
          .eq('user_id', user.id)
          .single();
        accessToken = data?.google_access_token;
      }
      if (!accessToken) return;

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (res.status === 401) {
        setConnected(false);
        return;
      }

      const data = await res.json();
      if (data.busy_level) {
        updateBusyLevel(data.busy_level);
        setEventCount(data.event_count);
        setLastSync(new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }

  if (!connected) {
    return (
      <button
        onClick={() => window.location.href = '/api/calendar/connect'}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-card))] hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors"
      >
        <CalendarDays className="w-5 h-5 text-[hsl(var(--text-muted))] shrink-0" />
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-[hsl(var(--text))]">Conectar Google Calendar</p>
          <p className="text-xs text-[hsl(var(--text-muted))]">Detecta días cargados automáticamente</p>
        </div>
        <span className="text-xs text-blue-400 font-medium">Conectar</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-green-500/20 bg-green-500/5">
      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-green-400">Calendario sincronizado</span>
          {eventCount !== null && (
            <span className="text-xs text-[hsl(var(--text-muted))]">· {eventCount} eventos hoy</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-[hsl(var(--text-muted))]">
            Contexto: <strong className="text-[hsl(var(--text))]">{BUSY_LABELS[today_context.busy_level]}</strong>
          </span>
          {lastSync && <span className="text-[10px] text-[hsl(var(--text-muted))]">· {lastSync}</span>}
        </div>
      </div>
      <button onClick={() => syncCalendar()} disabled={syncing}
        className={cn('p-1.5 rounded-lg hover:bg-green-500/10 transition-colors', syncing && 'opacity-50')}>
        <RefreshCw className={cn('w-3.5 h-3.5 text-green-400', syncing && 'animate-spin')} />
      </button>
    </div>
  );
}
