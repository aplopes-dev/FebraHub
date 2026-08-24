import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RequestEvolutionBatchSignatureUseCase } from '../../../../application/use-cases/request-evolution-batch-signature/request-evolution-batch-signature.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  resolveAuthenticatedUserDisplayName,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';

class RequestEvolutionBatchSignatureBodyDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  evolutionIds!: string[];

  @IsString()
  @MinLength(20)
  @MaxLength(20_000_000)
  fileBase64!: string;

  @IsOptional()
  @IsEmail()
  signerEmail?: string;
}

@ApiTags('signatures')
@Controller('v1/patients/:patientId/evolutions')
@RequirePermission('manage', 'Patient')
export class RequestEvolutionBatchSignatureRoute {
  constructor(
    private readonly requestEvolutionBatchSignature: RequestEvolutionBatchSignatureUseCase,
  ) {}

  @Post('request-signature')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar assinatura eletrônica de evoluções (lote)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: RequestEvolutionBatchSignatureBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const signature = await this.requestEvolutionBatchSignature.execute({
      storeId,
      patientId,
      evolutionIds: body.evolutionIds,
      fileBase64: body.fileBase64,
      signerEmail: body.signerEmail,
      requestedById: user.sub,
      requestedByName: resolveAuthenticatedUserDisplayName(user),
    });
    return { data: toElectronicSignatureResponse(signature) };
  }
}
