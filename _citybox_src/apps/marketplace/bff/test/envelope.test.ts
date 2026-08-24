import { test } from 'node:test';
import assert from 'node:assert/strict';
import { of, firstValueFrom } from 'rxjs';
import { HttpException } from '@nestjs/common';
import type { ArgumentsHost, CallHandler, ExecutionContext } from '@nestjs/common';
import {
  ApiError,
  EnvelopeExceptionFilter,
  EnvelopeInterceptor,
  paginated,
} from '../src/common/envelope.js';

const ctx = {} as ExecutionContext;

const next = (payload: unknown): CallHandler => ({ handle: () => of(payload) });

function mockResponse() {
  const captured: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      captured.status = code;
      return res;
    },
    json(body: unknown) {
      captured.body = body;
      return res;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { captured, host };
}

test('EnvelopeInterceptor envelopa payload cru em { data }', async () => {
  const interceptor = new EnvelopeInterceptor();
  const result = await firstValueFrom(interceptor.intercept(ctx, next({ ok: true })));
  assert.deepEqual(result, { data: { ok: true } });
});

test('EnvelopeInterceptor envelopa undefined como { data: null }', async () => {
  const interceptor = new EnvelopeInterceptor();
  const result = await firstValueFrom(interceptor.intercept(ctx, next(undefined)));
  assert.deepEqual(result, { data: null });
});

test('EnvelopeInterceptor preserva arrays e primitivos', async () => {
  const interceptor = new EnvelopeInterceptor();
  assert.deepEqual(await firstValueFrom(interceptor.intercept(ctx, next([1, 2]))), {
    data: [1, 2],
  });
  assert.deepEqual(await firstValueFrom(interceptor.intercept(ctx, next('ok'))), {
    data: 'ok',
  });
});

test('EnvelopeInterceptor com paginated() produz { data, meta }', async () => {
  const interceptor = new EnvelopeInterceptor();
  const payload = paginated([{ id: 'a' }], { page: 2, pageSize: 10, total: 42 });
  const result = await firstValueFrom(interceptor.intercept(ctx, next(payload)));
  assert.deepEqual(result, {
    data: [{ id: 'a' }],
    meta: { page: 2, pageSize: 10, total: 42 },
  });
});

test('EnvelopeExceptionFilter formata ApiError com code/field', () => {
  const { captured, host } = mockResponse();
  const filter = new EnvelopeExceptionFilter();
  filter.catch(new ApiError(422, 'VALIDATION_ERROR', 'Campo inválido', 'text'), host);
  assert.equal(captured.status, 422);
  assert.deepEqual(captured.body, {
    data: null,
    errors: [{ code: 'VALIDATION_ERROR', message: 'Campo inválido', field: 'text' }],
  });
});

test('EnvelopeExceptionFilter formata HttpException com mensagem única', () => {
  const { captured, host } = mockResponse();
  const filter = new EnvelopeExceptionFilter();
  filter.catch(new HttpException('Não encontrado', 404), host);
  assert.equal(captured.status, 404);
  assert.deepEqual(captured.body, {
    data: null,
    errors: [{ code: 'NOT_FOUND', message: 'Não encontrado', field: null }],
  });
});

test('EnvelopeExceptionFilter expande array de mensagens do ValidationPipe', () => {
  const { captured, host } = mockResponse();
  const filter = new EnvelopeExceptionFilter();
  filter.catch(
    new HttpException({ message: ['a é obrigatório', 'b inválido'], statusCode: 400 }, 400),
    host,
  );
  assert.equal(captured.status, 400);
  const body = captured.body as { errors: Array<{ code: string; message: string }> };
  assert.equal(body.errors.length, 2);
  assert.deepEqual(
    body.errors.map((e) => e.message),
    ['a é obrigatório', 'b inválido'],
  );
  assert.ok(body.errors.every((e) => e.code === 'BAD_REQUEST'));
});

test('EnvelopeExceptionFilter converte erro desconhecido em 500 INTERNAL', () => {
  const { captured, host } = mockResponse();
  const filter = new EnvelopeExceptionFilter();
  filter.catch(new Error('boom'), host);
  assert.equal(captured.status, 500);
  assert.deepEqual(captured.body, {
    data: null,
    errors: [{ code: 'INTERNAL', message: 'Erro interno inesperado', field: null }],
  });
});
