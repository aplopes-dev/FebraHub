import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RequestAnamnesisSignatureUseCase } from '../../../../application/use-cases/request-anamnesis-signature/request-anamnesis-signature.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  resolveAuthenticatedUserDisplayName,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';

class RequestAnamnesisSignatureBodyDto {
  @IsString()
  @MinLength(20)
  @MaxLength(20_000_000)
  fileBase64!: string;

  @IsOptional()
  @IsEmail()
  signerEmail?: string;
}

@ApiTags('signatures')
@Controller('v1/patients/:patientId/anamneses/:anamnesisId')
@RequirePermission('manage', 'Patient')
export class RequestAnamnesisSignatureRoute {
  constructor(
    private readonly requestAnamnesisSignature: RequestAnamnesisSignatureUseCase,
  ) {}

  @Post('request-signature')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar assinatura eletrônica da anamnese' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('anamnesisId') anamnesisId: string,
    @Body() body: RequestAnamnesisSignatureBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const signature = await this.requestAnamnesisSignature.execute({
      storeId,
      patientId,
      anamnesisId,
      fileBase64: body.fileBase64,
      signerEmail: body.signerEmail,
      requestedById: user.sub,
      requestedByName: resolveAuthenticatedUserDisplayName(user),
    });
    return { data: toElectronicSignatureResponse(signature) };
  }
}
