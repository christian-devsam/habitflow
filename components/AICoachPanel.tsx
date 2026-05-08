'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, Bot, Wand2 } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/authStore';
import { CoachBrief } from '@/lib/groq';
import { isScheduledToday, isCompletedToday } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AICoachPanelProps {
  onCreateHabit?: (habitData: object) => void;
}

export function AICoachPanel({ onCreateHabit }: AICoachPanelProps) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<CoachBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [tab, setTab] = useState<'brief' | 'chat'>('brief');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { habits, today_context } = useHabitStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (open && !brief) fetchBrief();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchBrief() {
    setBriefLoading(true);
    try {
      const todayHabits = habits.filter(isScheduledToday).map(h => ({
        id: h.id,
        name: h.name,
        current_streak: h.current_streak,
        current_difficulty_level: h.current_difficulty_level,
        completed: isCompletedToday(h),
        scheduled: true,
      }));

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits: todayHabits,
          context: today_context,
          userName: user?.user_metadata?.name ?? user?.email?.split('@')[0],
        }),
      });
      const data = await res.json();
      setBrief(data.brief);
    } catch (e) {
      console.error(e);
    } finally {
      setBriefLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setStreaming(true);

    const isHabitRequest = /crea|nuevo hábito|quiero|ayúdame a|agregar hábito/i.test(userMsg);

    if (isHabitRequest) {
      try {
        const res = await fetch('/api/ai/create-habit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: userMsg }),
        });
        const { habit } = await res.json();
        if (habit) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `¡Perfecto! Creé el hábito **${habit.nombre}** ${habit.icono} con 3 niveles. ¿Lo agrego a tu lista?`,
          }]);
          onCreateHabit?.(habit);
        }
        setStreaming(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Streaming chat
    try {
      const habitContext = {
        habits_count: habits.length,
        total_streak: habits.reduce((s, h) => s + h.current_streak, 0),
        context: today_context,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
          habitContext,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { text } = JSON.parse(data);
            assistantMsg += text;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantMsg };
              return updated;
            });
          } catch { /* skip malformed */ }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un problema conectando con la IA. Intenta de nuevo.',
      }]);
    } finally {
      setStreaming(false);
    }
  }

  const momentumColor = brief
    ? brief.puntuacion_momentum >= 70 ? '#22c55e'
    : brief.puntuacion_momentum >= 40 ? '#f59e0b' : '#ef4444'
    : '#3b82f6';

  return (
    <>
      {/* Floating button */}
      <motion.button
        className="fixed bottom-6 left-4 z-40"
        style={{ left: 'calc(50% - 200px + 16px)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
      >
        <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-sm font-semibold shadow-lg shadow-blue-500/30">
          <Sparkles className="w-4 h-4" />
          <span>Coach IA</span>
          {brief && (
            <div className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5"
              style={{ background: momentumColor }} />
          )}
        </div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-[hsl(var(--bg-card))] rounded-t-3xl max-h-[85vh] flex flex-col max-w-md mx-auto w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[hsl(var(--border))]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <h2 className="font-bold text-[hsl(var(--text))]">Coach IA</h2>
                </div>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[hsl(var(--bg-elevated))] transition-colors">
                  <X className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-5 gap-2 mb-4">
                {(['brief', 'chat'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', tab === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))]')}>
                    {t === 'brief' ? '✦ Brief del día' : '💬 Chat'}
                  </button>
                ))}
              </div>

              {/* Brief tab */}
              {tab === 'brief' && (
                <div className="px-5 pb-6 overflow-y-auto flex-1">
                  {briefLoading ? (
                    <div className="flex items-center gap-2 py-8 justify-center">
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-[hsl(var(--text-muted))] text-sm">Analizando tu día...</span>
                    </div>
                  ) : brief ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))]">
                        <div className="text-3xl mb-2">{brief.emoji}</div>
                        <p className="text-[hsl(var(--text))] text-sm leading-relaxed">{brief.mensaje}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">Acción inmediata</p>
                        <p className="text-[hsl(var(--text))] text-sm">{brief.accion_inmediata}</p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--bg-elevated))]">
                        <span className="text-xs text-[hsl(var(--text-muted))]">Momentum del día</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[hsl(var(--border))]">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${brief.puntuacion_momentum}%`, background: momentumColor }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: momentumColor }}>
                            {brief.puntuacion_momentum}%
                          </span>
                        </div>
                      </div>

                      <button onClick={fetchBrief}
                        className="w-full py-2.5 rounded-xl bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))] text-sm hover:bg-[hsl(var(--border))] transition-colors flex items-center justify-center gap-2">
                        <Wand2 className="w-3.5 h-3.5" />
                        Actualizar análisis
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Chat tab */}
              {tab === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3 min-h-0">
                    {messages.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-[hsl(var(--text-muted))] text-sm mb-3">
                          Pregúntame cualquier cosa sobre tus hábitos
                        </p>
                        {['¿Cómo mejorar mi racha?', 'Crea un hábito de lectura', '¿Qué hábito priorizar hoy?'].map(s => (
                          <button key={s} onClick={() => setInput(s)}
                            className="block w-full text-left px-3 py-2 rounded-xl bg-[hsl(var(--bg-elevated))] text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] mb-1.5 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                          m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text))] rounded-bl-sm'
                        )}>
                          {m.content || <span className="animate-pulse">...</span>}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-5 pb-6 pt-2 border-t border-[hsl(var(--border))]">
                    <div className="flex gap-2">
                      <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Escribe o pide crear un hábito..."
                        className="flex-1 bg-[hsl(var(--bg-elevated))] rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--text))] placeholder-[hsl(var(--text-muted))] outline-none border border-[hsl(var(--border))] focus:border-blue-500/50 transition-colors"
                      />
                      <button onClick={sendMessage} disabled={!input.trim() || streaming}
                        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors">
                        {streaming
                          ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                          : <Send className="w-4 h-4 text-white" />
                        }
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
