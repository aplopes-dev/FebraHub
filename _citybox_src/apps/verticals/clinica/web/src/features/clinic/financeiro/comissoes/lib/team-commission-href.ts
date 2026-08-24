/** Deep-link para a aba Comissão do membro em Configurações → Equipe. */
export function buildTeamMemberCommissionHref(memberId: string): string {
  const params = new URLSearchParams({
    memberId,
    tab: 'commission',
  });
  return `/configuracoes/equipe?${params.toString()}`;
}
