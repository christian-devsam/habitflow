import { NextRequest, NextResponse } from 'next/server';
import { BusyLevel } from '@/lib/types';

interface CalendarEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

function analyzeBusyLevel(events: CalendarEvent[]): BusyLevel {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  let totalMinutesBusy = 0;
  let eventCount = 0;

  for (const event of events) {
    const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    if (!start || !end) continue;
    if (start >= endOfDay || end <= startOfDay) continue;

    const overlap = Math.min(end.getTime(), endOfDay.getTime()) -
                    Math.max(start.getTime(), startOfDay.getTime());
    totalMinutesBusy += overlap / 60000;
    eventCount++;
  }

  if (totalMinutesBusy > 360 || eventCount >= 6) return 'overloaded';
  if (totalMinutesBusy > 180 || eventCount >= 3) return 'busy';
  if (eventCount >= 1) return 'normal';
  return 'free';
}

export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();
    if (!access_token) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=20`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!res.ok) {
      const err = await res.json();
      if (err.error?.code === 401) return NextResponse.json({ error: 'token_expired' }, { status: 401 });
      throw new Error('Calendar API error');
    }

    const data = await res.json();
    const events: CalendarEvent[] = data.items ?? [];
    const busyLevel = analyzeBusyLevel(events);
    const eventCount = events.filter((e: CalendarEvent) => e.start?.dateTime).length;

    return NextResponse.json({ busy_level: busyLevel, event_count: eventCount, events: events.slice(0, 5) });
  } catch (err) {
    console.error('[Calendar Events]', err);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }
}
