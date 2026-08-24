import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { SkipStoreScope } from '../../../../../shared/infra/http/decorators/skip-store-scope.decorator';
import { StoreId } from '../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { STORE_ROLES } from '../../../domain/store-role.catalog';
import { CreateMemberUseCase } from '../../../application/use-cases/create-member/create-member.use-case';
import { GetMyAccessUseCase } from '../../../application/use-cases/get-my-access/get-my-access.use-case';
import { ResetMemberPasswordUseCase } from '../../../application/use-cases/reset-member-password/reset-member-password.use-case';
import { ListMembersUseCase } from '../../../application/use-cases/list-members/list-members.use-case';
import { GetMemberByIdUseCase } from '../../../application/use-cases/get-member-by-id/get-member-by-id.use-case';
import { UpdateMemberUseCase } from '../../../application/use-cases/update-member/update-member.use-case';
import { GetMemberWorkScheduleUseCase } from '../../../application/use-cases/get-member-work-schedule/get-member-work-schedule.use-case';
import { ReplaceMemberWorkScheduleUseCase } from '../../../application/use-cases/replace-member-work-schedule/replace-member-work-schedule.use-case';
import { ListMemberWorkSchedulesUseCase } from '../../../application/use-cases/list-member-work-schedules/list-member-work-schedules.use-case';
import {
  CreateMemberBodyDto,
  ListMemberWorkSchedulesQueryDto,
  ListMembersQueryDto,
  ReplaceMemberWorkScheduleBodyDto,
  UpdateMemberBodyDto,
} from './members.dto';
import { MembersPresenter } from './members.presenter';

@ApiTags('members')
@Controller('v1/members')
export class MembersRoute {
  constructor(
    private readonly getMyAccess: GetMyAccessUseCase,
    private readonly createMember: CreateMemberUseCase,
    private readonly listMembers: ListMembersUseCase,
    private readonly getMemberById: GetMemberByIdUseCase,
    private readonly updateMember: UpdateMemberUseCase,
    private readonly getMemberWorkSchedule: GetMemberWorkScheduleUseCase,
    private readonly replaceMemberWorkSchedule: ReplaceMemberWorkScheduleUseCase,
    private readonly listMemberWorkSchedules: ListMemberWorkSchedulesUseCase,
    private readonly resetMemberPassword: ResetMemberPasswordUseCase,
  ) {}

  @SkipStoreScope()
  @Get('me')
  @ApiOperation({ summary: 'Organização e lojas acessíveis ao usuário logado' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return MembersPresenter.myAccess(await this.getMyAccess.execute(user.sub));
  }

  @SkipStoreScope()
  @Get('roles')
  @ApiOperation({ summary: 'Catálogo de papéis lean da vertical Beautiful' })
  roles() {
    return { items: STORE_ROLES.map((r) => ({ ...r })) };
  }

  /** BEFORE `/:id` — Nest registra na ordem de declaração. */
  @RequirePermission('read', 'Team')
  @Get('work-schedules')
  @ApiOperation({
    summary:
      'Lista grades semanais em lote (memberIds CSV; schedulable default true)',
  })
  async listWorkSchedules(
    @StoreId() storeId: string,
    @Query() query: ListMemberWorkSchedulesQueryDto,
  ) {
    const list = await this.listMemberWorkSchedules.execute({
      storeId,
      memberIds: query.memberIds,
      schedulable: query.schedulable,
    });
    return MembersPresenter.workSchedules(list);
  }

  @RequirePermission('read', 'Team')
  @Get()
  @ApiOperation({
    summary: 'Lista membros da loja (search / status / schedulable / role)',
  })
  async list(@StoreId() storeId: string, @Query() query: ListMembersQueryDto) {
    const members = await this.listMembers.execute({
      storeId,
      search: query.search,
      status: query.status,
      schedulable: query.schedulable,
      role: query.role,
    });
    return MembersPresenter.list(members);
  }

  @RequirePermission('create', 'Team')
  @Post()
  @ApiOperation({
    summary: 'Convida membro (Keycloak + StoreMember)',
  })
  async create(
    @StoreId() storeId: string,
    @Body() body: CreateMemberBodyDto,
  ) {
    const result = await this.createMember.execute({
      storeId,
      ...body,
    });
    return MembersPresenter.created(result);
  }

  @RequirePermission('read', 'Team')
  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do membro com week + serviceIds' })
  async getById(@StoreId() storeId: string, @Param('id') id: string) {
    const member = await this.getMemberById.execute({
      storeId,
      memberId: id,
    });
    const { week, ...rest } = member;
    return MembersPresenter.one(rest, { week });
  }

  @RequirePermission('update', 'Team')
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza perfil, serviços, papel, permissões e/ou grade semanal',
  })
  async update(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateMemberBodyDto,
  ) {
    const member = await this.updateMember.execute({
      storeId,
      memberId: id,
      ...body,
    });
    return MembersPresenter.one(member);
  }

  @RequirePermission('update', 'Team')
  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Gera nova senha provisória (Keycloak)' })
  async resetPassword(@StoreId() storeId: string, @Param('id') id: string) {
    const result = await this.resetMemberPassword.execute({
      storeId,
      memberId: id,
    });
    return MembersPresenter.resetPassword(result);
  }

  @RequirePermission('read', 'Team')
  @Get(':id/work-schedule')
  @ApiOperation({ summary: 'Grade semanal de horário do membro' })
  async getWorkSchedule(@StoreId() storeId: string, @Param('id') id: string) {
    const schedule = await this.getMemberWorkSchedule.execute({
      storeId,
      memberId: id,
    });
    return MembersPresenter.workSchedule(schedule);
  }

  @RequirePermission('update', 'Team')
  @Put(':id/work-schedule')
  @ApiOperation({
    summary: 'Replace atômico da grade semanal de horário do membro',
  })
  async replaceWorkSchedule(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: ReplaceMemberWorkScheduleBodyDto,
  ) {
    const schedule = await this.replaceMemberWorkSchedule.execute({
      storeId,
      memberId: id,
      week: body.week,
    });
    return MembersPresenter.workSchedule(schedule);
  }
}
