import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { PlatformPrisma } from '../src/database/platform.js';
import type { AuthUser } from '../src/auth/auth.types.js';
import { UsersService } from '../src/users/users.service.js';

const humanUser: AuthUser = {
  sub: 'kc-user-1',
  roles: ['backoffice'],
  kind: 'user',
  name: 'Maria Silva',
  email: 'maria@test.com',
};

const deviceUser: AuthUser = {
  sub: 'device-1',
  roles: ['device'],
  kind: 'device',
  storeId: 'store-1',
};

function createService(overrides?: {
  platform?: Partial<PlatformPrisma>;
  keycloakConfigured?: boolean;
  verifyPassword?: boolean;
}) {
  const defaultPlatformUser = {
    findUnique: mock.fn(async () => null),
    upsert: mock.fn(async (args: { create: Record<string, unknown> }) => ({
      id: 'u1',
      ...args.create,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    })),
    update: mock.fn(async () => ({})),
  };
  const platformOverrides = overrides?.platform ?? {};
  const { platformUser: platformUserOverrides, ...restPlatform } = platformOverrides as {
    platformUser?: Partial<typeof defaultPlatformUser>;
  };
  const platform = {
    ...restPlatform,
    platformUser: {
      ...defaultPlatformUser,
      ...platformUserOverrides,
    },
  } as unknown as PlatformPrisma;

  const keycloakAdmin = {
    isConfigured: () => overrides?.keycloakConfigured ?? true,
    updateProfile: mock.fn(async () => undefined),
    changeOwnPassword: mock.fn(async () => {
      if (overrides?.verifyPassword === false) {
        const { BadRequestException } = await import('@nestjs/common');
        throw new BadRequestException('Senha atual incorreta');
      }
    }),
  };

  const minio = {
    uploadFile: mock.fn(async () => 'users/kc-user-1/avatar'),
    getFile: mock.fn(async () => Buffer.from('img')),
    deleteFile: mock.fn(async () => undefined),
  };

  const service = new UsersService(platform, keycloakAdmin as never, minio as never);
  return { service, platform, keycloakAdmin, minio };
}

describe('UsersService', () => {
  it('getMeProfile retorna dados do JWT quando não há projeção', async () => {
    const { service } = createService();
    const profile = await service.getMeProfile(humanUser);
    assert.equal(profile.sub, 'kc-user-1');
    assert.equal(profile.name, 'Maria Silva');
    assert.equal(profile.email, 'maria@test.com');
    assert.equal(profile.hasPhoto, false);
  });

  it('getMeProfile usa projeção local quando existe', async () => {
    const findUnique = mock.fn(async () => ({
      id: 'u1',
      keycloakSub: 'kc-user-1',
      displayName: 'Maria DB',
      email: 'db@test.com',
      photoKey: 'users/kc-user-1/avatar',
      photoMimeType: 'image/png',
      createdAt: new Date(),
      updatedAt: new Date('2026-06-01'),
    }));
    const { service } = createService({
      platform: { platformUser: { findUnique } } as never,
    });
    const profile = await service.getMeProfile(humanUser);
    assert.equal(profile.name, 'Maria DB');
    assert.equal(profile.email, 'db@test.com');
    assert.equal(profile.hasPhoto, true);
    assert.equal(profile.updatedAt, new Date('2026-06-01').toISOString());
  });

  it('rejeita perfil para credencial de dispositivo', async () => {
    const { service } = createService();
    await assert.rejects(
      () => service.getMeProfile(deviceUser),
      /credenciais de dispositivo/,
    );
  });

  it('updateOwnProfile sincroniza Keycloak e faz upsert local', async () => {
    const { service, keycloakAdmin, platform } = createService();
    const profile = await service.updateOwnProfile(humanUser, { name: 'Maria Souza' });
    assert.equal(keycloakAdmin.updateProfile.mock.calls.length, 1);
    assert.equal(platform.platformUser.upsert.mock.calls.length, 1);
    assert.equal(profile.name, 'Maria Souza');
  });

  it('rejeita update de conta sem Keycloak Admin configurado', async () => {
    const { service } = createService({ keycloakConfigured: false });
    await assert.rejects(
      () => service.updateOwnProfile(humanUser, { email: 'nova@test.com' }),
      /Keycloak Admin não configurado/,
    );
  });

  it('rejeita senha sem token de sessão', async () => {
    const { service } = createService();
    await assert.rejects(
      () =>
        service.updateOwnProfile(humanUser, {
          password: 'nova-senha-1',
          currentPassword: 'citybox',
        }),
      /Sessão inválida/,
    );
  });

  it('altera senha sem Keycloak Admin (Account API)', async () => {
    const { service, keycloakAdmin } = createService({ keycloakConfigured: false });
    await service.updateOwnProfile(
      humanUser,
      { password: 'nova-senha-1', currentPassword: 'citybox' },
      undefined,
      'user-jwt',
    );
    assert.equal(keycloakAdmin.changeOwnPassword.mock.calls.length, 1);
  });

  it('rejeita senha sem senha atual', async () => {
    const { service } = createService();
    await assert.rejects(
      () => service.updateOwnProfile(humanUser, { password: 'nova-senha-1' }),
      /senha atual/,
    );
  });

  it('rejeita senha com credencial atual incorreta', async () => {
    const { service } = createService({ verifyPassword: false });
    await assert.rejects(
      () =>
        service.updateOwnProfile(
          humanUser,
          { password: 'nova-senha-1', currentPassword: 'errada' },
          undefined,
          'user-jwt',
        ),
      /Senha atual incorreta/,
    );
  });

  it('altera senha via Account API com JWT do usuário', async () => {
    const { service, keycloakAdmin } = createService({ verifyPassword: true });
    await service.updateOwnProfile(
      humanUser,
      { password: 'nova-senha-1', currentPassword: 'citybox' },
      undefined,
      'user-jwt',
    );
    assert.equal(keycloakAdmin.changeOwnPassword.mock.calls.length, 1);
    const args = keycloakAdmin.changeOwnPassword.mock.calls[0]!.arguments as string[];
    assert.equal(args[0], 'user-jwt');
    assert.equal(args[1], 'citybox');
    assert.equal(args[2], 'nova-senha-1');
  });

  it('rejeita foto vazia', async () => {
    const { service } = createService();
    await assert.rejects(
      () =>
        service.updateOwnProfile(humanUser, {}, { mimetype: 'image/png', size: 0, buffer: Buffer.alloc(0) }),
      /obrigatório/,
    );
  });

  it('rejeita foto acima de 4 MB', async () => {
    const { service } = createService();
    await assert.rejects(
      () =>
        service.updateOwnProfile(
          humanUser,
          {},
          { mimetype: 'image/png', size: 5 * 1024 * 1024, buffer: Buffer.from('x') },
        ),
      /4 MB/,
    );
  });

  it('rejeita MIME inválido', async () => {
    const { service } = createService();
    await assert.rejects(
      () =>
        service.updateOwnProfile(
          humanUser,
          {},
          { mimetype: 'application/pdf', size: 100, buffer: Buffer.from('x') },
        ),
      /PNG, JPEG ou WebP/,
    );
  });

  it('faz upload de foto válida', async () => {
    const findUnique = mock.fn(async () => ({
      id: 'u1',
      keycloakSub: 'kc-user-1',
      displayName: 'Maria Silva',
      email: 'maria@test.com',
      photoKey: 'users/kc-user-1/avatar',
      photoMimeType: 'image/png',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const { service, minio } = createService({
      platform: { platformUser: { findUnique } } as never,
    });
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    await service.updateOwnProfile(
      humanUser,
      {},
      { mimetype: 'image/png', size: pngBuffer.length, buffer: pngBuffer },
    );
    assert.equal(minio.uploadFile.mock.calls.length, 1);
  });

  it('getPhoto retorna null sem foto', async () => {
    const { service } = createService();
    const photo = await service.getPhoto(humanUser);
    assert.equal(photo, null);
  });

  it('getPhoto retorna buffer quando existe', async () => {
    const findUnique = mock.fn(async () => ({
      id: 'u1',
      keycloakSub: 'kc-user-1',
      photoKey: 'users/kc-user-1/avatar',
      photoMimeType: 'image/jpeg',
      email: null,
      displayName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const { service } = createService({
      platform: { platformUser: { findUnique } } as never,
    });
    const photo = await service.getPhoto(humanUser);
    assert.ok(photo);
    assert.equal(photo?.mimeType, 'image/jpeg');
  });

  it('getPhoto retorna null quando MinIO falha', async () => {
    const findUnique = mock.fn(async () => ({
      id: 'u1',
      keycloakSub: 'kc-user-1',
      photoKey: 'users/kc-user-1/avatar',
      photoMimeType: 'image/png',
      email: null,
      displayName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const minio = {
      getFile: mock.fn(async () => {
        throw new Error('not found');
      }),
      uploadFile: mock.fn(),
      deleteFile: mock.fn(),
    };
    const svc = new UsersService(
      { platformUser: { findUnique } } as never,
      { isConfigured: () => true } as never,
      minio as never,
    );
    const photo = await svc.getPhoto(humanUser);
    assert.equal(photo, null);
  });

  it('removePhoto limpa metadados', async () => {
    const findUnique = mock.fn(async () => ({
      id: 'u1',
      keycloakSub: 'kc-user-1',
      photoKey: 'users/kc-user-1/avatar',
      photoMimeType: 'image/png',
      email: null,
      displayName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const { service, minio } = createService({
      platform: { platformUser: { findUnique, update: mock.fn(async () => ({})) } } as never,
    });
    await service.removePhoto(humanUser);
    assert.equal(minio.deleteFile.mock.calls.length, 1);
  });

  it('removePhoto ignora quando não há foto', async () => {
    const { service, minio } = createService();
    await service.removePhoto(humanUser);
    assert.equal(minio.deleteFile.mock.calls.length, 0);
  });
});
