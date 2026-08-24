import { http, type HttpHandler } from 'msw';
import i18n from '@/i18n';
import { MOCK_RESET_TOKEN } from '@/data/mock';
import { db, persistDb } from '../db';
import { errorResponse, ok, noContent, parseJson, requireAuth } from './shared';

export const authHandlers: HttpHandler[] = [
  http.get('*/auth/session', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok({ user: db.user, isAuthenticated: true });
  }),

  http.post('*/auth/login', async ({ request }) => {
    const body = await parseJson<{ account?: string; password?: string }>(request);
    if (!body?.account || !body?.password) {
      return errorResponse(
        422,
        'VALIDATION_ERROR',
        'validation.required',
        !body?.account ? 'account' : 'password',
      );
    }

    const account = body.account.trim().toLowerCase();
    const validAccount =
      account === 'camila@email.com' || account === 'camila@gmail.com';
    if (!validAccount || body.password !== db.userPassword) {
      return errorResponse(
        401,
        'INVALID_CREDENTIALS',
        'auth.invalidCredentials',
        'password',
      );
    }

    db.user = {
      ...db.user,
      email: body.account.includes('@') ? body.account : db.user.email,
    };
    db.accessToken = 'mock-token-camila';
    persistDb();

    return ok({
      accessToken: db.accessToken,
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: db.user,
    });
  }),

  http.post('*/auth/register', async ({ request }) => {
    const body = await parseJson<{
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    }>(request);
    if (!body?.name || !body?.email || !body?.password) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'email');
    }

    db.user = {
      id: `usr_${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone ?? '',
      avatarUrl: null,
      avatarInitial: body.name.charAt(0).toUpperCase(),
      isPlus: false,
      hasSeenOnboarding: true,
    };
    db.accessToken = `mock-token-${Date.now()}`;
    persistDb();

    return ok({
      accessToken: db.accessToken,
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: db.user,
    });
  }),

  http.post('*/auth/google', () => {
    db.user = { ...db.user, email: 'camila@gmail.com' };
    db.accessToken = 'mock-token-google';
    persistDb();
    return ok({
      accessToken: db.accessToken,
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: db.user,
    });
  }),

  http.post('*/auth/forgot-password', async ({ request }) => {
    const body = await parseJson<{ email?: string }>(request);
    if (!body?.email?.includes('@')) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidEmail', 'email');
    }
    return ok({
      message: i18n.t('auth.resetEmailSent', { ns: 'api' }),
      sent: true,
    });
  }),

  http.post('*/auth/reset-password', async ({ request }) => {
    const body = await parseJson<{
      token?: string;
      password?: string;
      confirmPassword?: string;
    }>(request);
    if (!body?.token || !body?.password || !body?.confirmPassword) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'password');
    }
    if (body.password !== body.confirmPassword) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.passwordMismatch', 'confirmPassword');
    }
    if (body.password.length < 4) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.passwordTooShort', 'password');
    }
    if (body.token !== MOCK_RESET_TOKEN) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidToken', 'token');
    }
    db.userPassword = body.password;
    persistDb();
    return ok({ message: i18n.t('auth.passwordChanged', { ns: 'api' }) });
  }),

  http.post('*/auth/refresh', async ({ request }) => {
    const body = await parseJson<{ refreshToken?: string }>(request);
    if (!body?.refreshToken) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.refreshTokenRequired', 'refreshToken');
    }
    db.accessToken = `mock-token-refreshed-${Date.now()}`;
    persistDb();
    return ok({ accessToken: db.accessToken, expiresIn: 3600 });
  }),

  http.post('*/auth/onboarding', async ({ request }) => {
    const body = await parseJson<{ deviceId?: string; hasSeenOnboarding?: boolean }>(
      request,
    );
    if (!body?.deviceId) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'deviceId');
    }
    db.onboardingByDevice.set(body.deviceId, Boolean(body.hasSeenOnboarding));
    return ok({ hasSeenOnboarding: Boolean(body.hasSeenOnboarding) });
  }),

  http.patch('*/me/onboarding', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ hasSeenOnboarding?: boolean }>(request);
    db.user = { ...db.user, hasSeenOnboarding: Boolean(body?.hasSeenOnboarding) };
    persistDb();
    return ok({ hasSeenOnboarding: db.user.hasSeenOnboarding });
  }),

  http.post('*/auth/logout', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return noContent();
  }),
];
