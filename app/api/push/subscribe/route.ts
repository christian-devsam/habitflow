import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { subscription, user_id } = await req.json();
    if (!subscription || !user_id) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await supabase.from('user_context').upsert({
      user_id,
      push_subscription: subscription,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Push Subscribe]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
