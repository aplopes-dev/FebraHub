import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Pkcs12FileValidator } from '../../../../domain/validators/pkcs12-file.validator';
import { UploadCertificateUseCase } from '../../../../application/use-cases/upload-certificate/upload-certificate.use-case';
import { CertificatePresenter } from '../shared/certificate.presenter';

@ApiTags('certificates')
@Controller('v1/companies/:companyId/certificates')
@RequirePermission('fiscal.certificates.manage')
export class UploadCertificateRoute {
  constructor(private readonly uploadCertificate: UploadCertificateUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: Pkcs12FileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload de certificado digital A1 (.pfx) — FR-007, US3 cenário 1/2',
  })
  async handle(
    @Param('companyId') companyId: string,
    @Body('password') password?: string,
    @Body('name') name?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório (campo "file")');
    }
    if (!password?.trim()) {
      throw new BadRequestException('Senha do certificado obrigatória');
    }

    const certificate = await this.uploadCertificate.execute({
      companyId,
      buffer: file.buffer,
      filename: file.originalname,
      password,
      name,
    });
    return CertificatePresenter.toHttp(certificate);
  }
}
