import { BadRequestException } from '@nestjs/common';
import type { UpsertStoreMemberDto } from '../dtos/store-detail.dto';

export function validateStoreMemberOnboarding(dto: UpsertStoreMemberDto): void {
  if (dto.generateProvisionalPassword && dto.sendInviteEmail) {
    throw new BadRequestException(
      'Selecione apenas uma opção: senha provisória ou convite por e-mail',
    );
  }

  if (dto.sendInviteEmail && !dto.email?.trim()) {
    throw new BadRequestException('E-mail é obrigatório para enviar convite');
  }
}
