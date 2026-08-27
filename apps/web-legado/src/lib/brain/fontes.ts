/** Nomes amigáveis das fontes da memória institucional. */

export const NOME_FONTE: Record<string, string> = {
  geral: "Geral",
  comercial: "Comercial",
  financeiro: "Financeiro",
  marketing: "Marketing",
  pedagogico: "Pedagógico",
  eventos: "Eventos",
  loja: "Loja",
  estoque: "Estoque",
  crm: "CRM",
  diretoria: "Diretoria",
};

export const rotuloFonte = (f: string) => NOME_FONTE[f] ?? f;
