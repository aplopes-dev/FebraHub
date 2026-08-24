import {
  BadRequestException,
  Controller,
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
import { PreviewBankStatementUseCase } from '../../../../application/use-cases/preview-bank-statement/preview-bank-statement.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

const MAX_BANK_STATEMENT_BYTES = 10 * 1024 * 1024;

@ApiTags('bank-statements')
@Controller('v1/bank-statements')
export class PreviewBankStatementRoute {
  constructor(
    private readonly previewBankStatement: PreviewBankStatementUseCase,
  ) {}

  @Post('preview')
  @RequirePermission('store.finance.manage')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_BANK_STATEMENT_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Pré-visualizar extrato OFX (sem persistir)',
    description:
      'Extrai o código do banco do arquivo e sugere a conta bancária ' +
      '(FR-007a) para o diálogo de importação pré-selecionar antes da ' +
      'confirmação. Não grava nada — só o `POST /v1/bank-statements` importa de verdade.',
  })
  @ApiResponse({
    status: 200,
    description: 'Código do banco + sugestão de conta',
  })
  @ApiResponse({
    status: 422,
    description: 'Arquivo não é um OFX válido/legível',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }

    const result = await this.previewBankStatement.execute({
      organizationId,
      fileName: file.originalname,
      buffer: file.buffer,
    });

    return { data: result };
  }
}
