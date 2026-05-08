import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(req: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 400 });
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL ?? 'mailto:admin@habitflow.app',
      publicKey,
      privateKey
    );

    const { subscription, title, body, icon, data } = await req.json();
    if (!subscription) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: icon ?? '/icon-192.png', data })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Push Send]', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
