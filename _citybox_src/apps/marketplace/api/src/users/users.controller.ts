import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto.js';
import { ProfileRateLimitGuard } from './profile-rate-limit.guard.js';
import { UserStoreAssignmentsService } from './user-store-assignments.service.js';
import { UsersService } from './users.service.js';

type UploadedPhoto = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly storeAssignments: UserStoreAssignmentsService,
  ) {}

  @Get('me/stores')
  @ApiOperation({
    summary: 'Lojas vinculadas ao usuário autenticado (legacy — backoffice/ERP usa platform-api)',
    deprecated: true,
  })
  async listMyStores(@CurrentUser() user: AuthUser | null) {
    if (!user) throw new UnauthorizedException();
    const stores = await this.storeAssignments.listForUser(user.sub);
    return { stores };
  }

  @Patch('me')
  @UseGuards(ProfileRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 4 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 120 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        currentPassword: { type: 'string', maxLength: 128 },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Atualizar o próprio perfil (sync Keycloak)' })
  updateMe(
    @Body() dto: UpdateOwnProfileDto,
    @CurrentUser() user: AuthUser | null,
    @Req() req: Request,
    @UploadedFile() photo?: UploadedPhoto,
  ) {
    if (!user) throw new UnauthorizedException();
    const header = req.headers.authorization;
    const userAccessToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    return this.users.updateOwnProfile(user, dto, photo, userAccessToken);
  }

  @Delete('me/photo')
  @ApiOperation({ summary: 'Remover foto do próprio perfil' })
  removeMyPhoto(@CurrentUser() user: AuthUser | null) {
    if (!user) throw new UnauthorizedException();
    return this.users.removePhoto(user);
  }

  @Get('me/photo')
  @ApiOperation({ summary: 'Obter foto do próprio perfil' })
  async getMyPhoto(@CurrentUser() user: AuthUser | null, @Res() res: Response) {
    if (!user) {
      res.status(401).end();
      return;
    }
    const photo = await this.users.getPhoto(user);
    if (!photo) {
      res.status(204).end();
      return;
    }
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(photo.buffer);
  }
}
