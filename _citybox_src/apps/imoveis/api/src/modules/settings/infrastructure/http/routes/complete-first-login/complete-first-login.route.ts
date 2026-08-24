import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompleteFirstLoginUseCase } from '../../../../application/use-cases/complete-first-login/complete-first-login.use-case';
import { mapTeamMemberToHttp } from '../shared/team-member-response.mapper';

export class CompleteFirstLoginDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/users')
export class CompleteFirstLoginRoute {
  constructor(private readonly completeFirstLogin: CompleteFirstLoginUseCase) {}

  @Post(':agentId/complete-first-login')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Settings')
  @ApiOperation({
    summary: 'Concluir primeiro login trocando a senha provisória',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: CompleteFirstLoginDto,
  ) {
    const member = await this.completeFirstLogin.execute({
      storeId,
      agentId,
      newPassword: dto.newPassword,
    });
    return { data: mapTeamMemberToHttp(member) };
  }
}
