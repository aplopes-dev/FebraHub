import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RequestContractSignatureUseCase } from '../../../../application/use-cases/request-contract-signature/request-contract-signature.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  resolveAuthenticatedUserDisplayName,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';

class ResponsibleSignerDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class RequestContractSignatureBodyDto {
  @IsString()
  @MinLength(20)
  @MaxLength(20_000_000)
  fileBase64!: string;

  @IsOptional()
  @IsEmail()
  signerEmail?: string;

  @ValidateNested()
  @Type(() => ResponsibleSignerDto)
  responsible!: ResponsibleSignerDto;
}

@ApiTags('signatures')
@Controller('v1/patients/:patientId/contracts/:contractId')
@RequirePermission('manage', 'Patient')
export class RequestContractSignatureRoute {
  constructor(
    private readonly requestContractSignature: RequestContractSignatureUseCase,
  ) {}

  @Post('request-signature')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar assinatura eletrônica do contrato' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('contractId') contractId: string,
    @Body() body: RequestContractSignatureBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const signature = await this.requestContractSignature.execute({
      storeId,
      patientId,
      contractId,
      fileBase64: body.fileBase64,
      signerEmail: body.signerEmail,
      responsible: body.responsible,
      requestedById: user.sub,
      requestedByName: resolveAuthenticatedUserDisplayName(user),
    });
    return { data: toElectronicSignatureResponse(signature) };
  }
}
