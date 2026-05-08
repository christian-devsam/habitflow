import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?calendar_error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');

    // Get user from session cookie
    const authHeader = req.headers.get('cookie') ?? '';
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      await supabase.from('user_context').upsert({
        user_id: session.user.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token ?? null,
        google_token_expiry: expiry,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?calendar_connected=1`);
  } catch (err) {
    console.error('[Calendar Callback]', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?calendar_error=auth_failed`);
  }
}
