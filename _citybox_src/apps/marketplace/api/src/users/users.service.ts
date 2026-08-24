import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import type { PlatformPrisma } from '../database/platform.js';
import { PLATFORM_PRISMA } from '../platform/platform.module.js';
import type { AuthMeResponse, AuthUser } from '../auth/auth.types.js';
import { resolvePermissions } from '../auth/permissions.js';
import { KeycloakAdminService } from '../identity/keycloak-admin.service.js';
import { MinioService } from '../storage/minio.service.js';
import { validateProfileImageBuffer } from '../common/image-magic-bytes.js';
import type { UpdateOwnProfileDto } from './dto/update-own-profile.dto.js';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

type UploadedPhoto = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function photoKeyForSub(keycloakSub: string): string {
  return `users/${keycloakSub}/avatar`;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectService(PLATFORM_PRISMA) private readonly platform: PlatformPrisma,
    private readonly keycloakAdmin: KeycloakAdminService,
    private readonly minio: MinioService,
  ) {}

  private assertHumanUser(user: AuthUser): void {
    if (user.kind !== 'user') {
      throw new ForbiddenException('Perfil indisponível para credenciais de dispositivo');
    }
  }

  async getMeProfile(user: AuthUser): Promise<AuthMeResponse> {
    this.assertHumanUser(user);
    const row = await this.platform.platformUser.findUnique({
      where: { keycloakSub: user.sub },
    });
    return {
      sub: user.sub,
      name: row?.displayName ?? user.name ?? 'Usuário',
      email: row?.email ?? user.email ?? null,
      roles: user.roles,
      permissions: resolvePermissions(user),
      storeId: user.storeId,
      kind: user.kind,
      hasPhoto: Boolean(row?.photoKey),
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  }

  async getPhoto(
    user: AuthUser,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    this.assertHumanUser(user);
    const row = await this.platform.platformUser.findUnique({
      where: { keycloakSub: user.sub },
    });
    if (!row?.photoKey) return null;
    try {
      const buffer = await this.minio.getFile(row.photoKey);
      return { buffer, mimeType: row.photoMimeType ?? 'image/png' };
    } catch {
      return null;
    }
  }

  async updateOwnProfile(
    user: AuthUser,
    dto: UpdateOwnProfileDto,
    photo?: UploadedPhoto,
    userAccessToken?: string,
  ): Promise<AuthMeResponse> {
    this.assertHumanUser(user);

    if ((dto.name || dto.email) && !this.keycloakAdmin.isConfigured()) {
      throw new BadRequestException(
        'Alteração de conta indisponível: serviço Keycloak Admin não configurado',
      );
    }

    if (dto.name || dto.email) {
      await this.keycloakAdmin.updateProfile(user.sub, {
        name: dto.name,
        email: dto.email,
      });
    }
    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Informe a senha atual para alterar a senha');
      }
      if (!userAccessToken) {
        throw new BadRequestException('Sessão inválida para alterar a senha');
      }
      await this.keycloakAdmin.changeOwnPassword(
        userAccessToken,
        dto.currentPassword,
        dto.password,
      );
    }

    let photoKey: string | undefined;
    let photoMimeType: string | undefined;
    if (photo) {
      if (!photo.buffer?.length) {
        throw new BadRequestException('Arquivo de imagem obrigatório');
      }
      if (photo.size > MAX_PHOTO_BYTES) {
        throw new BadRequestException('A imagem deve ter no máximo 4 MB');
      }
      let verifiedMime: string;
      try {
        verifiedMime = validateProfileImageBuffer(photo.buffer, photo.mimetype);
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        if (code === 'MIME_MISMATCH') {
          throw new BadRequestException('Tipo da imagem não confere com o conteúdo do arquivo');
        }
        throw new BadRequestException('Use imagem PNG, JPEG ou WebP válida');
      }
      photoKey = photoKeyForSub(user.sub);
      await this.minio.uploadFile(photoKey, photo.buffer, verifiedMime);
      photoMimeType = verifiedMime;
    }

    const displayName = dto.name ?? user.name;
    const email = dto.email ?? user.email;

    await this.platform.platformUser.upsert({
      where: { keycloakSub: user.sub },
      create: {
        keycloakSub: user.sub,
        displayName: displayName ?? null,
        email: email ?? null,
        photoKey: photoKey ?? null,
        photoMimeType: photoMimeType ?? null,
      },
      update: {
        ...(displayName !== undefined ? { displayName: displayName ?? null } : {}),
        ...(email !== undefined ? { email: email ?? null } : {}),
        ...(photoKey ? { photoKey, photoMimeType: photoMimeType ?? null } : {}),
      },
    });

    return this.getMeProfile({
      ...user,
      name: displayName ?? user.name,
      email: email ?? user.email,
    });
  }

  async removePhoto(user: AuthUser): Promise<AuthMeResponse> {
    this.assertHumanUser(user);
    const row = await this.platform.platformUser.findUnique({
      where: { keycloakSub: user.sub },
    });
    if (row?.photoKey) {
      try {
        await this.minio.deleteFile(row.photoKey);
      } catch {
        // ignore
      }
      await this.platform.platformUser.update({
        where: { keycloakSub: user.sub },
        data: { photoKey: null, photoMimeType: null },
      });
    }
    return this.getMeProfile(user);
  }
}
