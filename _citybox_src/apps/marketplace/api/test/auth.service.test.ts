import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthService } from '../src/auth/auth.service.js';

describe('AuthService', () => {
  const originalBypass = process.env.AUTH_DEV_BYPASS;

  beforeEach(() => {
    process.env.AUTH_DEV_BYPASS = 'true';
  });

  afterEach(() => {
    process.env.AUTH_DEV_BYPASS = originalBypass;
  });

  it('dev-admin bypass em AUTH_DEV_BYPASS', async () => {
    const svc = new AuthService({ deviceCredential: { findFirst: async () => null } } as never);
    const user = await svc.verifyBearer('dev-admin');
    assert.equal(user.sub, 'dev-admin');
    assert.ok(user.roles.includes('platform.admin'));
  });

  it('device token válido resolve store', async () => {
    const raw = 'device-secret-token';
    const hash = createHash('sha256').update(raw).digest('hex');
    const platform = {
      deviceCredential: {
        findFirst: mock.fn(async () => ({
          id: 'cred-1',
          storeId: 'store-1',
          store: {},
        })),
      },
    };
    const svc = new AuthService(platform as never);
    const user = await svc.verifyBearer(`device:${raw}`);
    assert.equal(user.kind, 'device');
    assert.equal(user.storeId, 'store-1');
    assert.equal(platform.deviceCredential.findFirst.mock.calls[0].arguments[0].where.tokenHash, hash);
  });

  it('device token inválido lança Unauthorized', async () => {
    const platform = {
      deviceCredential: { findFirst: mock.fn(async () => null) },
    };
    const svc = new AuthService(platform as never);
    await assert.rejects(() => svc.verifyBearer('device:bad'), UnauthorizedException);
  });
});
