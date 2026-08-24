import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  defineAbilityFor,
  filterVisibleSalesFunnels,
} from '@citybox/clinica-permissions';
import { CurrentClinicScope } from '../../../../../../shared/infra/http/decorators/clinic-scope.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  RequireAnyPermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { ClinicScope } from '../../../../../../shared/infra/http/guards/clinic-scope.guard';
import { ListSalesFunnelsUseCase } from '../../../../../sales/funnels/application/use-cases/list-sales-funnels/list-sales-funnels.use-case';
import {
  buildScheduleAbility,
  resolveScheduleProfessionalFilter,
} from '../../../../../scheduling/shared/infra/schedule-permission.helpers';
import { GlobalSearchUseCase } from '../../../../application/use-cases/global-search/global-search.use-case';
import type { SearchScope } from '../../../database/search.repository';
import { GlobalSearchPresenter } from './global-search.presenter';

function canSearchSales(ability: ReturnType<typeof defineAbilityFor>): boolean {
  return (
    ability.can('access', 'Sales') ||
    ability.can('read', 'Sales') ||
    ability.can('readScheduleFunnel', 'Sales') ||
    ability.can('readSalesFunnel', 'Sales') ||
    ability.can('readCustomFunnel', 'Sales') ||
    ability.can('readClinicFunnels', 'Sales') ||
    ability.can('manage', 'Sales')
  );
}

@ApiTags('search')
@ApiBearerAuth()
@Controller('v1/search')
export class GlobalSearchRoute {
  constructor(
    private readonly globalSearch: GlobalSearchUseCase,
    private readonly listFunnels: ListSalesFunnelsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequireAnyPermission(
    { action: 'access', subject: 'Patient' },
    { action: 'read', subject: 'Patient' },
    { action: 'access', subject: 'Schedule' },
    { action: 'access', subject: 'Sales' },
    { action: 'read', subject: 'Sales' },
    { action: 'readScheduleFunnel', subject: 'Sales' },
    { action: 'readSalesFunnel', subject: 'Sales' },
    { action: 'readCustomFunnel', subject: 'Sales' },
    { action: 'readClinicFunnels', subject: 'Sales' },
    { action: 'manage', subject: 'Sales' },
    { action: 'access', subject: 'Stock' },
    { action: 'manage', subject: 'Stock' },
  )
  @ApiOperation({
    summary:
      'Busca global FTS (pacientes, agenda, oportunidades, estoque) — escopo por permissão',
  })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'perType', required: false })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentClinicScope() scope: ClinicScope,
    @Query('q') q?: string,
    @Query('perType') perTypeRaw?: string,
  ) {
    if (typeof q !== 'string') {
      throw new BadRequestException('q é obrigatório.');
    }
    if (q.length > 200) {
      throw new BadRequestException('q deve ter no máximo 200 caracteres.');
    }

    let perType: number | undefined;
    if (perTypeRaw !== undefined && perTypeRaw !== '') {
      const parsed = Number(perTypeRaw);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new BadRequestException('perType deve ser um inteiro ≥ 1.');
      }
      perType = parsed;
    }

    const ability = defineAbilityFor({
      userId: scope.memberId,
      permissions: scope.permissions,
      isOrganizationOwner: user.isOrganizationOwner === true,
    });

    const scheduleAbility = buildScheduleAbility({
      userId: scope.memberId,
      permissions: scope.permissions,
      isOrganizationOwner: user.isOrganizationOwner === true,
    });

    const searchScope = await this.buildSearchScope(
      storeId,
      ability,
      scheduleAbility,
      scope.memberId,
      scope.permissions,
    );

    const result = await this.globalSearch.execute({
      storeId,
      q,
      perType,
      scope: searchScope,
    });

    return GlobalSearchPresenter.toHttp(result);
  }

  private async buildSearchScope(
    storeId: string,
    ability: ReturnType<typeof defineAbilityFor>,
    scheduleAbility: ReturnType<typeof buildScheduleAbility>,
    memberId: string,
    permissions: string[],
  ): Promise<SearchScope> {
    const includePatients =
      ability.can('access', 'Patient') || ability.can('read', 'Patient');
    const includeAppointments = ability.can('access', 'Schedule');
    const includeStock =
      ability.can('access', 'Stock') || ability.can('manage', 'Stock');
    const includeOpportunities = canSearchSales(ability);

    let visibleFunnelIds: string[] | undefined;
    if (includeOpportunities) {
      const listed = await this.listFunnels.execute({
        storeId,
        page: 1,
        perPage: 100,
      });
      const visible = filterVisibleSalesFunnels(
        listed.items,
        permissions,
      );
      visibleFunnelIds = visible.map((funnel) => funnel.id);
    }

    const professionalIds = includeAppointments
      ? resolveScheduleProfessionalFilter(scheduleAbility, memberId, undefined)
      : undefined;

    return {
      includePatients,
      includeAppointments,
      includeOpportunities,
      includeStock,
      professionalIds,
      visibleFunnelIds,
    };
  }
}
