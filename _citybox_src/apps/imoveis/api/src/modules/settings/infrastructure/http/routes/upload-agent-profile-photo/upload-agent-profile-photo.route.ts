import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ImageFileValidator } from '../../../../../properties/application/validators/image-file.validator';
import { UploadAgentProfilePhotoUseCase } from '../../../../application/use-cases/upload-agent-profile-photo/upload-agent-profile-photo.use-case';
import { UploadAgentProfilePhotoPresenter } from './upload-agent-profile-photo.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/photo')
export class UploadAgentProfilePhotoRoute {
  constructor(
    private readonly uploadAgentProfilePhoto: UploadAgentProfilePhotoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: ImageFileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar foto do perfil do corretor (multipart)' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }
    const profile = await this.uploadAgentProfilePhoto.execute({
      storeId,
      agentId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return UploadAgentProfilePhotoPresenter.toHttp(profile);
  }
}
