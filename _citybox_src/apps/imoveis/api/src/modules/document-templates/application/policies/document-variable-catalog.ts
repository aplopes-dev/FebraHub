/** Catálogo fixo de placeholders — HTTP/UI e merge usam as mesmas chaves. */

export type DocumentVariableGroupId =
  | 'lead'
  | 'imovel'
  | 'corretor'
  | 'loja'
  | 'visita'
  | 'negocio'
  | 'locacao'
  | 'data';

export type DocumentVariableDef = {
  key: string;
  label: string;
  group: DocumentVariableGroupId;
  example: string;
};

export const DOCUMENT_VARIABLE_GROUPS: Record<
  DocumentVariableGroupId,
  string
> = {
  lead: 'Lead',
  imovel: 'Imóvel',
  corretor: 'Corretor',
  loja: 'Loja',
  visita: 'Visita',
  negocio: 'Negócio',
  locacao: 'Locação',
  data: 'Data',
};

export const DOCUMENT_VARIABLES: readonly DocumentVariableDef[] = [
  { key: 'lead.nome', label: 'Nome do lead', group: 'lead', example: 'Ana Silva' },
  {
    key: 'lead.telefone',
    label: 'Telefone',
    group: 'lead',
    example: '(73) 99999-0000',
  },
  { key: 'lead.email', label: 'E-mail', group: 'lead', example: 'ana@email.com' },
  { key: 'lead.cidade', label: 'Cidade', group: 'lead', example: 'Ilhéus' },
  {
    key: 'imovel.titulo',
    label: 'Título do imóvel',
    group: 'imovel',
    example: 'Apt Centro',
  },
  {
    key: 'imovel.endereco',
    label: 'Endereço',
    group: 'imovel',
    example: 'Rua das Flores, 10',
  },
  {
    key: 'imovel.preco',
    label: 'Preço',
    group: 'imovel',
    example: 'R$ 450.000,00',
  },
  { key: 'imovel.tipo', label: 'Tipo', group: 'imovel', example: 'Apartamento' },
  {
    key: 'imovel.finalidade',
    label: 'Finalidade',
    group: 'imovel',
    example: 'Venda',
  },
  {
    key: 'corretor.nome',
    label: 'Nome do corretor',
    group: 'corretor',
    example: 'João Corretor',
  },
  {
    key: 'corretor.creci',
    label: 'CRECI',
    group: 'corretor',
    example: '12345-F',
  },
  {
    key: 'corretor.telefone',
    label: 'Telefone do corretor',
    group: 'corretor',
    example: '(73) 98888-0000',
  },
  {
    key: 'loja.nome',
    label: 'Nome da imobiliária',
    group: 'loja',
    example: 'Imob Ilhéus',
  },
  { key: 'visita.data', label: 'Data da visita', group: 'visita', example: '19/08/2026' },
  {
    key: 'visita.horario',
    label: 'Horário',
    group: 'visita',
    example: '14:00',
  },
  {
    key: 'visita.local',
    label: 'Local',
    group: 'visita',
    example: 'Apt Centro',
  },
  { key: 'negocio.tipo', label: 'Tipo do negócio', group: 'negocio', example: 'Venda' },
  {
    key: 'negocio.valor',
    label: 'Valor',
    group: 'negocio',
    example: 'R$ 450.000,00',
  },
  {
    key: 'negocio.formaPagamento',
    label: 'Forma de pagamento',
    group: 'negocio',
    example: 'PIX',
  },
  {
    key: 'locacao.locador',
    label: 'Locador',
    group: 'locacao',
    example: 'Carlos Proprietário',
  },
  {
    key: 'locacao.locatario',
    label: 'Locatário',
    group: 'locacao',
    example: 'Ana Silva',
  },
  {
    key: 'locacao.aluguel',
    label: 'Aluguel',
    group: 'locacao',
    example: 'R$ 2.500,00',
  },
  { key: 'data.hoje', label: 'Data de hoje', group: 'data', example: '19/08/2026' },
];

export type DocumentMergeSnapshot = {
  lead: {
    nome: string;
    telefone: string;
    email: string;
    cidade: string;
  };
  imovel: {
    titulo: string;
    endereco: string;
    preco: string;
    tipo: string;
    finalidade: string;
  };
  corretor: {
    nome: string;
    creci: string;
    telefone: string;
  };
  loja: { nome: string };
  visita: {
    data: string;
    horario: string;
    local: string;
  };
  negocio: {
    tipo: string;
    valor: string;
    formaPagamento: string;
  };
  locacao: {
    locador: string;
    locatario: string;
    aluguel: string;
  };
  data: { hoje: string };
};

export function emptyMergeSnapshot(): DocumentMergeSnapshot {
  return {
    lead: { nome: '', telefone: '', email: '', cidade: '' },
    imovel: { titulo: '', endereco: '', preco: '', tipo: '', finalidade: '' },
    corretor: { nome: '', creci: '', telefone: '' },
    loja: { nome: '' },
    visita: { data: '', horario: '', local: '' },
    negocio: { tipo: '', valor: '', formaPagamento: '' },
    locacao: { locador: '', locatario: '', aluguel: '' },
    data: { hoje: '' },
  };
}
