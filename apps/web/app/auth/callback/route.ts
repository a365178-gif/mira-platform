import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const proposedDestination = next?.startsWith('/') && !next.startsWith('//')
    ? new URL(next, requestUrl.origin)
    : new URL('/members/me', requestUrl.origin);
  const safeDestination = proposedDestination.origin === requestUrl.origin
    ? proposedDestination
    : new URL('/members/me', requestUrl.origin);
  const supabase = await createSupabaseServerClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(safeDestination);
  }

  return NextResponse.redirect(new URL('/login?notice=verification', requestUrl.origin));
}
