'use client';
import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}

type Status = 'idle' | 'unsupported' | 'needs-install' | 'granted' | 'denied' | 'loading';

export function PushSetup() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    if (!isStandalone) {
      setStatus('needs-install');
      return;
    }

    if (Notification.permission === 'granted') setStatus('granted');
    else if (Notification.permission === 'denied') setStatus('denied');
    else setStatus('idle');
  }, []);

  async function subscribe() {
    if (!user) return;
    setStatus('loading');
    try {
      const keyRes = await fetch('/api/push/vapid-key');
      if (!keyRes.ok) { setStatus('unsupported'); return; }
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), user_id: user.id }),
      });

      setStatus('granted');
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  }

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
        <Bell className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs text-green-400">Notificaciones activas</span>
      </div>
    );
  }

  if (status === 'needs-install') {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Smartphone className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-300">Agrega a pantalla de inicio</p>
          <p className="text-[10px] text-amber-400/70">
            Safari → Compartir → Añadir a inicio para activar notificaciones
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unsupported' || status === 'denied') return null;

  return (
    <button onClick={subscribe} disabled={status === 'loading'}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] hover:border-blue-500/30 transition-colors text-xs">
      <Bell className="w-3.5 h-3.5" />
      <span>Activar recordatorios</span>
    </button>
  );
}
