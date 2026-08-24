import { HttpResponse } from 'msw';
import i18n from '@/i18n';

export function errorResponse(
  status: number,
  code: string,
  messageKey: string,
  field?: string | null,
) {
  return HttpResponse.json(
    {
      data: null,
      errors: [{ code, message: i18n.t(messageKey, { ns: 'api' }), field: field ?? null }],
    },
    { status },
  );
}

export function requireAuth(request: Request): Response | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return errorResponse(401, 'UNAUTHORIZED', 'unauthorized');
  }
  return null;
}

export function parseJson<T>(request: Request): Promise<T | null> {
  return request
    .json()
    .then((body) => body as T)
    .catch(() => null);
}

export function ok<T>(data: T, init?: ResponseInit) {
  return HttpResponse.json({ data }, init);
}

export function okWithMeta<T>(
  data: T,
  meta: { page?: number; pageSize?: number; total?: number },
  init?: ResponseInit,
) {
  return HttpResponse.json({ data, meta }, init);
}

export function noContent() {
  return new HttpResponse(null, { status: 204 });
}
