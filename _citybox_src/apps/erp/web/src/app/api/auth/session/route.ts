import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  applyBffTokenCookies,
  clearAuthCookies,
  publicSessionFromTokens,
  resolveAccessTokenForBff,
} from '@/lib/auth-server';

/** Sessão atual. Renova pelo refresh token quando o access está por vencer. */
export async function GET() {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    const response = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (accessResult.clearCookies) clearAuthCookies(response);
    return response;
  }

  const session = publicSessionFromTokens(accessResult.access);
  const response = NextResponse.json(session);
  if (accessResult.tokens) applyBffTokenCookies(response, accessResult);
  return response;
}
