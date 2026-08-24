import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ImportBankStatementUseCase } from '../../../../application/use-cases/import-bank-statement/import-bank-statement.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import {
  Actor,
  OrganizationId,
} from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { RequestActor } from '../../../../../../../shared/infra/tenancy/tenant-context';
import { ImportBankStatementHttpDto } from '../shared/bank-statement.dto';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';

/** RN/spec Assumptions — 10MB, sem processamento assíncrono nesta entrega. */
const MAX_BANK_STATEMENT_BYTES = 10 * 1024 * 1024;

@ApiTags('bank-statements')
@Controller('v1/bank-statements')
export class ImportBankStatementRoute {
  constructor(
    private readonly importBankStatement: ImportBankStatementUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.finance.manage')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_BANK_STATEMENT_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar extrato bancário OFX' })
  @ApiResponse({ status: 201, description: 'Extrato importado' })
  @ApiResponse({
    status: 404,
    description: 'Conta bancária informada não encontrada',
  })
  @ApiResponse({
    status: 422,
    description: 'Arquivo não é um OFX válido/legível',
  })
  @ApiResponse({ status: 413, description: 'Arquivo maior que 10MB' })
  async handle(
    @OrganizationId() organizationId: string,
    @Actor() actor: RequestActor,
    @Body() dto: ImportBankStatementHttpDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }

    const result = await this.importBankStatement.execute({
      organizationId,
      bankAccountId: dto.bankAccountId,
      fileName: file.originalname,
      buffer: file.buffer,
      importedByName: actor.name ?? '',
    });

    return BankStatementPresenter.toHttpImport(result);
  }
}
