import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

function enabled() {
  return process.env.NODE_ENV === 'development' && process.env.MIRA_TEST_MODE === 'true';
}

export async function POST(request: Request) {
  if (!enabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Origin rejected' }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('adultConfirmed' in body) || body.adultConfirmed !== true) {
    return NextResponse.json({ error: 'Adult confirmation required' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase?.auth.getUser() ?? { data: { user: null }, error: null };
  if (authError || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Test activation requires server-side Supabase service configuration' }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc('test_activate_adult_member', { p_user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, result: data });
}
