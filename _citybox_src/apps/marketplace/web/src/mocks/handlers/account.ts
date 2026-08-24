import { http, type HttpHandler } from 'msw';
import i18n from '@/i18n';
import { CEP_MOCK } from '@/data/mock';
import type { ApiAddress, ApiAddressInput, ApiCardBrand } from '@/api/types';
import { db, nextId, persistDb } from '../db';
import { errorResponse, ok, noContent, parseJson, requireAuth } from './shared';

function detectBrand(number: string): ApiCardBrand {
  const d = number.replace(/\D/g, '');
  if (d.startsWith('4')) return 'VISA';
  if (d.startsWith('5')) return 'MASTERCARD';
  if (d.startsWith('3')) return 'AMEX';
  if (d.startsWith('6')) return 'ELO';
  return 'UNKNOWN';
}

function toAddress(input: ApiAddressInput, id?: string): ApiAddress {
  return {
    id: id ?? nextId('addr'),
    label: input.label,
    zipCode: input.zipCode,
    street: input.street,
    number: input.number,
    complement: input.complement ?? undefined,
    neighborhood: input.neighborhood,
    city: input.city,
    state: input.state,
    isDefault: input.isDefault ?? false,
  };
}

export const accountHandlers: HttpHandler[] = [
  http.get('*/me', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok({ user: db.user });
  }),

  http.patch('*/me', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<Partial<{ name: string; email: string; phone: string }>>(
      request,
    );
    db.user = {
      ...db.user,
      ...(body?.name !== undefined ? { name: body.name } : {}),
      ...(body?.email !== undefined ? { email: body.email } : {}),
      ...(body?.phone !== undefined ? { phone: body.phone } : {}),
    };
    persistDb();
    return ok({ user: db.user });
  }),

  http.delete('*/me', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ password?: string; confirmation?: string }>(request);
    if (body?.password !== db.userPassword) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'auth.wrongPassword', 'password');
    }
    if (body?.confirmation !== 'EXCLUIR') {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidConfirmation', 'confirmation');
    }
    return noContent();
  }),

  http.post('*/me/avatar', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const avatarUrl = `https://cdn.citybox.com.br/avatars/${db.user.id}.jpg`;
    db.user = { ...db.user, avatarUrl };
    persistDb();
    return ok({ avatarUrl });
  }),

  http.get('*/me/settings', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok(db.settings);
  }),

  http.patch('*/me/settings', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<Partial<typeof db.settings>>(request);
    db.settings = { ...db.settings, ...body };
    persistDb();
    return ok(db.settings);
  }),

  http.get('*/me/subscription', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok(db.subscription);
  }),

  http.post('*/me/subscription/cancel', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    db.subscription = { ...db.subscription, isActive: false };
    persistDb();
    return ok({
      isActive: false,
      cancelledAt: new Date().toISOString(),
      accessUntil: db.subscription.renewalDate,
    });
  }),

  http.get('*/me/addresses', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok({ addresses: db.addresses });
  }),

  http.post('*/me/addresses', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<ApiAddressInput>(request);
    if (!body?.label || !body.zipCode || !body.street) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'label');
    }

    const address = toAddress(body);
    if (address.isDefault) {
      db.addresses = db.addresses.map((a) => ({ ...a, isDefault: false }));
    }
    db.addresses.push(address);
    persistDb();
    return ok({ address }, { status: 201 });
  }),

  http.put('*/me/addresses/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const id = String(params.id);
    const idx = db.addresses.findIndex((a) => a.id === id);
    if (idx < 0) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.address');
    }

    const body = await parseJson<ApiAddressInput>(request);
    if (!body) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidData');
    }

    const updated = toAddress(body, id);
    if (updated.isDefault) {
      db.addresses = db.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    db.addresses[idx] = updated;
    persistDb();
    return ok({ address: updated });
  }),

  http.delete('*/me/addresses/:id', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const id = String(params.id);
    const before = db.addresses.length;
    db.addresses = db.addresses.filter((a) => a.id !== id);
    if (db.addresses.length === before) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.address');
    }
    persistDb();
    return noContent();
  }),

  http.patch('*/me/addresses/:id/default', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const id = String(params.id);
    const address = db.addresses.find((a) => a.id === id);
    if (!address) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.address');
    }

    db.addresses = db.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    persistDb();
    return ok({ address: { ...address, isDefault: true } });
  }),

  http.get('*/addresses/zip/:zipCode', ({ params }) => {
    const digits = String(params.zipCode).replace(/\D/g, '');
    const mock = CEP_MOCK[digits];
    if (!mock) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.zipCode');
    }
    return ok({
      zipCode: digits.replace(/(\d{5})(\d{3})/, '$1-$2'),
      street: mock.street ?? '',
      neighborhood: mock.neighborhood ?? '',
      city: mock.city ?? '',
      state: mock.state ?? '',
    });
  }),

  http.get('*/me/payment-methods', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok({ paymentMethods: db.paymentMethods });
  }),

  http.post('*/me/payment-methods', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{
      number?: string;
      holderName?: string;
      expiry?: string;
      cvv?: string;
      label?: string;
      isDefault?: boolean;
    }>(request);
    if (!body?.number || !body.holderName || !body.expiry) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'number');
    }

    const digits = body.number.replace(/\D/g, '');
    const paymentMethod = {
      id: nextId('card'),
      brand: detectBrand(digits),
      lastFour: digits.slice(-4),
      expiry: body.expiry,
      holderName: body.holderName,
      label: body.label ?? i18n.t('payment.newCardLabel', { ns: 'api' }),
      isDefault: body.isDefault ?? false,
    };

    if (paymentMethod.isDefault) {
      db.paymentMethods = db.paymentMethods.map((p) => ({ ...p, isDefault: false }));
    }
    db.paymentMethods.push(paymentMethod);
    persistDb();
    return ok({ paymentMethod }, { status: 201 });
  }),

  http.delete('*/me/payment-methods/:id', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const id = String(params.id);
    const before = db.paymentMethods.length;
    db.paymentMethods = db.paymentMethods.filter((p) => p.id !== id);
    if (db.paymentMethods.length === before) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.card');
    }
    persistDb();
    return noContent();
  }),

  http.patch('*/me/payment-methods/:id/default', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const id = String(params.id);
    const pm = db.paymentMethods.find((p) => p.id === id);
    if (!pm) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.card');
    }

    db.paymentMethods = db.paymentMethods.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    persistDb();
    return ok({ paymentMethod: { ...pm, isDefault: true }, paymentMethods: db.paymentMethods });
  }),
];
