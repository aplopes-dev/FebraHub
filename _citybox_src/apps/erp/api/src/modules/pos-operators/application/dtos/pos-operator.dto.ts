/**
 * Organização e unidade vêm do **terminal** autenticado, não do corpo da
 * requisição: o dispositivo não escolhe de que loja é o membro que entra.
 */
export type AuthenticatePosOperatorDto = {
  organizationId: string;
  branchId: string;
  code: string;
  pin: string;
};

export type ListTerminalOperatorsDto = {
  organizationId: string;
  branchId: string;
};

/** Mesmo recorte da listagem — o que muda é o que a resposta carrega. */
export type SyncTerminalOperatorsDto = ListTerminalOperatorsDto;
