import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreRepository } from '../../../../domain/repositories/store.repository.interface';
import { StoreNotFoundError } from '../../../../domain/errors/store-not-found.error';
import { VerticalMemberProvisioning } from '../../../../domain/providers/vertical-member-provisioning.provider';
import { VerticalNotSupportedError } from '../../../../domain/errors/vertical-provisioning.error';

class UnitAssignmentDto {
  @IsString() clinicId!: string;
  @IsString() role!: string;
}

class CreateVerticalMemberBodyDto {
  @IsString() @Length(1, 80) firstName!: string;
  @IsString() @Length(1, 80) lastName!: string;
  @IsString() @Matches(/^[a-z0-9._-]+$/) @Length(3, 60) username!: string;
  @IsOptional() @IsEmail() email?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UnitAssignmentDto)
  assignments!: UnitAssignmentDto[];
}

/**
 * Gestão de equipe pelo admin, **delegada à vertical** (decisão D1).
 *
 * O platform não guarda cópia de escrita destes membros — a vertical é a dona. A chamada
 * é síncrona porque o admin precisa da senha provisória e do erro real na resposta.
 */
@ApiTags('stores')
@Controller('v1/stores/:storeId/vertical-team')
@RequirePermission('platform.admin')
export class VerticalMembersRoute {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly provisioning: VerticalMemberProvisioning,
  ) {}

  private async resolveStore(storeId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store)
      throw new StoreNotFoundError(VerticalMembersRoute.name, storeId);
    if (!this.provisioning.isSupported(store.vertical)) {
      throw new VerticalNotSupportedError(
        VerticalMembersRoute.name,
        store.vertical,
      );
    }
    return store;
  }

  /**
   * **Responsável** da loja lido na vertical, que é a dona da equipe desde o PLAT-001.
   *
   * Substituiu a listagem da equipe inteira (`GET /vertical-team`): pelo admin gerencia-se
   * apenas o responsável — colaborador é cadastrado dentro do app da vertical. Devolver a
   * equipe toda daria ao operador uma lista que ele não pode operar.
   *
   * `owner: null` é resposta legítima (loja cujo evento `store.created` veio sem
   * `responsibleName`), e é diferente de erro: a tela precisa poder dizer "não tem
   * responsável" sem confundir com "não consegui falar com a vertical".
   */
  @Get('owner')
  @ApiOperation({
    summary: 'Responsável da loja segundo a vertical (dona da equipe)',
  })
  async owner(@Param('storeId') storeId: string) {
    const store = await this.resolveStore(storeId);
    return {
      owner: await this.provisioning.findOwner(storeId, store.vertical),
    };
  }

  @Get('units')
  @ApiOperation({
    summary: 'Unidades da vertical (ex.: clínicas da organização)',
  })
  async units(@Param('storeId') storeId: string) {
    const store = await this.resolveStore(storeId);
    return {
      items: await this.provisioning.listUnits(storeId, store.vertical),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Cria membro na vertical (síncrono, devolve senha provisória)',
  })
  async create(
    @Param('storeId') storeId: string,
    @Body() body: CreateVerticalMemberBodyDto,
  ) {
    const store = await this.resolveStore(storeId);
    return this.provisioning.createMember({
      storeId,
      vertical: store.vertical,
      firstName: body.firstName,
      lastName: body.lastName,
      username: body.username,
      email: body.email ?? null,
      assignments: body.assignments,
    });
  }

  /**
   * Gera credenciais do **responsável pela organização** e as devolve uma única vez.
   *
   * O Keycloak de desenvolvimento não tem SMTP (`smtpServer` ausente no realm importado),
   * então convite por e-mail não sai — o admin exibe usuário e senha na tela e o operador
   * repassa. A senha **não** é logada nem persistida em claro em nenhum ponto do caminho.
   */
  @Post('owner/reset-password')
  @ApiOperation({
    summary:
      'Gera senha provisória do responsável (síncrono, exibida uma única vez)',
  })
  async resetOwnerPassword(@Param('storeId') storeId: string) {
    const store = await this.resolveStore(storeId);
    return this.provisioning.resetOwnerPassword(storeId, store.vertical);
  }
}
