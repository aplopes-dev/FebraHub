import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/jwt.guard.js';
import { badRequest } from '../common/envelope.js';
import { InjectService } from '../common/inject.js';
import type { ConsumerUserRecord } from './users.service.js';
import { MeService } from './me.service.js';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

/** Arquivo multipart do multer (tipado localmente — sem depender de @types/multer). */
interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

class DeleteMeDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  confirmation?: string;
}

class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  pushOrdersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushPromoEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailPromoEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  darkTheme?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(@InjectService(MeService) private readonly meService: MeService) {}

  @Get()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  me(@CurrentUser() user: ConsumerUserRecord) {
    return this.meService.me(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualiza nome/telefone (e-mail não pode ser alterado)' })
  update(@CurrentUser() user: ConsumerUserRecord, @Body() body: UpdateMeDto) {
    return this.meService.update(user, body);
  }

  @Delete()
  @ApiOperation({ summary: 'Exclui a conta (dados + usuário Keycloak)' })
  deleteAccount(@CurrentUser() user: ConsumerUserRecord, @Body() _body: DeleteMeDto) {
    return this.meService.deleteAccount(user);
  }

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload do avatar (multipart, image/*, máx. 2MB)' })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@CurrentUser() user: ConsumerUserRecord, @UploadedFile() file?: UploadedFileLike) {
    if (!file) throw badRequest('Envie o arquivo no campo "file"', 'file');
    if (!file.mimetype.startsWith('image/')) {
      throw badRequest('Arquivo deve ser uma imagem', 'file');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw badRequest('Imagem excede o limite de 2MB', 'file');
    }
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.meService.updateAvatar(user, dataUrl);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Preferências do usuário' })
  settings(@CurrentUser() user: ConsumerUserRecord) {
    return this.meService.settings(user);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Atualiza preferências do usuário' })
  updateSettings(@CurrentUser() user: ConsumerUserRecord, @Body() body: UpdateSettingsDto) {
    return this.meService.updateSettings(user, body);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Assinatura CityBox+ do usuário' })
  subscription(@CurrentUser() user: ConsumerUserRecord) {
    return this.meService.subscription(user);
  }

  @Post('subscription/cancel')
  @ApiOperation({ summary: 'Cancela a assinatura CityBox+' })
  cancelSubscription(
    @CurrentUser() user: ConsumerUserRecord,
    @Body() _body: CancelSubscriptionDto,
  ) {
    return this.meService.cancelSubscription(user);
  }
}
