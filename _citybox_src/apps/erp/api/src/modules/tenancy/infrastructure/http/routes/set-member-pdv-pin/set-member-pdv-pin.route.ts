import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import {
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SetMemberPdvPinUseCase } from '../../../../application/use-cases/set-member-pdv-pin/set-member-pdv-pin.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { POS_OPERATOR_PIN_LENGTH } from '../../../../../pos-operators/domain/validators/pos-operator-pin';
import { MemberPresenter } from '../shared/member.presenter';

class SetMemberPdvPinHttpDto {
  @ApiProperty({ example: '1234', minLength: 4, maxLength: 4 })
  @IsString()
  @MinLength(POS_OPERATOR_PIN_LENGTH)
  @MaxLength(POS_OPERATOR_PIN_LENGTH)
  @Matches(/^\d+$/)
  pin!: string;

  /**
   * Opcional: o create do ERP manda código + PIN na mesma chamada; a edição
   * costuma gravar o código antes via `PUT /v1/members/:id`. Sem este campo no
   * DTO o ValidationPipe descartava `pdvCode` e o membro nascia sem acesso ao
   * PDV (lista vazia no terminal).
   */
  @ApiPropertyOptional({
    example: '01',
    nullable: true,
    description: 'Código PDV; se omitido, usa o já gravado no membro.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(16)
  pdvCode?: string | null;
}

@ApiTags('members')
@Controller('v1/members')
export class SetMemberPdvPinRoute {
  constructor(private readonly setMemberPdvPin: SetMemberPdvPinUseCase) {}

  @Put(':id/pdv-pin')
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Definir/redefinir PIN de caixa do membro',
    description:
      'Aceita `pdvCode` opcional no body (create do ERP). Sem código no body nem no membro, falha. Destrava bloqueio por tentativas.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetMemberPdvPinHttpDto,
  ) {
    const detail = await this.setMemberPdvPin.execute({
      organizationId,
      membershipId: id,
      pin: dto.pin,
      pdvCode: dto.pdvCode,
    });
    return MemberPresenter.toHttpSingle(detail);
  }
}
