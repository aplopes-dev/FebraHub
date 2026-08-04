/**
 * CATÁLOGO DE PERMISSÕES — a lista fechada do que existe para conceder.
 *
 * O backend é a fonte: a tela de perfis desenha os grupos a partir de
 * `GET /permissoes/catalogo`, e a gravação recusa qualquer id que não esteja
 * aqui. Assim uma permissão inventada no front (ou num curl) nunca entra no
 * banco e nunca aparece como um checkbox órfão.
 *
 * DOIS EIXOS, NÃO UM
 * Permissão diz o QUE se pode fazer; setor diz SOBRE QUAIS DADOS. A ponte
 * entre eles são as permissões `setor.<hub>.ver`: elas ampliam o alcance de
 * quem precisa enxergar além do próprio setor, sem que ninguém precise
 * cadastrar setor extra pessoa por pessoa. Quem checa os dois é podeVer()
 * em common/guards/setor.guard.ts.
 */

export interface DefinicaoPermissao {
  id: string;
  nome: string;
  descricao: string;
}

export interface GrupoPermissoes {
  id: string;
  nome: string;
  descricao: string;
  permissoes: DefinicaoPermissao[];
}

/** Hubs setoriais, na ordem do menu. CRM entra: ele é setor no cadastro. */
const HUBS: { chave: string; nome: string }[] = [
  { chave: 'comercial', nome: 'Comercial' },
  { chave: 'financeiro', nome: 'Financeiro' },
  { chave: 'marketing', nome: 'Marketing' },
  { chave: 'pedagogico', nome: 'Pedagógico' },
  { chave: 'eventos', nome: 'Eventos' },
  { chave: 'loja', nome: 'Loja' },
  { chave: 'estoque', nome: 'Estoque' },
  { chave: 'crm', nome: 'CRM' },
];

export const CATALOGO_PERMISSOES: GrupoPermissoes[] = [
  {
    id: 'paineis',
    nome: 'Painéis',
    descricao: 'As telas do bloco Painéis — as visões consolidadas da diretoria.',
    permissoes: [
      {
        id: 'executivo.ver',
        nome: 'Hub Executivo',
        descricao: 'Abrir o painel de indicadores. Os cards continuam recortados pelos setores da pessoa.',
      },
      {
        id: 'executivo.metas',
        nome: 'Definir metas',
        descricao: 'Criar e alterar as metas dos indicadores do Hub Executivo.',
      },
      {
        id: 'territorial.ver',
        nome: 'Inteligência Territorial',
        descricao: 'Abrir o mapa de empresas e conexões do território.',
      },
      {
        id: 'organograma.ver',
        nome: 'Organograma',
        descricao: 'Abrir o organograma de setores, funções, funcionários e agentes de IA.',
      },
      {
        id: 'organograma.editar',
        nome: 'Editar o organograma',
        descricao: 'Adicionar, alterar e remover membros do organograma.',
      },
    ],
  },
  {
    id: 'setores',
    nome: 'Setores',
    descricao:
      'Amplia o alcance de dados além do setor do cadastro. Sem nenhuma marcada, a pessoa continua vendo apenas o próprio setor.',
    permissoes: HUBS.map((h) => ({
      id: `setor.${h.chave}.ver`,
      nome: h.nome,
      descricao: `Ver os dados do hub ${h.nome} mesmo sem ter o setor no cadastro.`,
    })),
  },
  {
    id: 'integracoes',
    nome: 'Integrações',
    descricao: 'Conexões com as fontes externas, WhatsApp e agentes de IA.',
    permissoes: [
      {
        id: 'integracoes.ver',
        nome: 'Ver as fontes de dados',
        descricao: 'Consultar o estado das conexões e a validade dos tokens.',
      },
      {
        id: 'integracoes.gerenciar',
        nome: 'Conectar e desconectar fontes',
        descricao: 'Autorizar, renovar e desconectar as fontes de dados externas.',
      },
      {
        id: 'whatsapp.gerenciar',
        nome: 'Conexão do WhatsApp',
        descricao: 'Ler o QR, conectar e desconectar o número do WhatsApp.',
      },
      {
        id: 'agentes.gerenciar',
        nome: 'Pareamento dos agentes de IA',
        descricao: 'Parear e desparear o workspace da plataforma Aplopes AI.',
      },
    ],
  },
  {
    id: 'administracao',
    nome: 'Administração',
    descricao: 'Quem entra, com qual perfil, e o que é comunicado a todos.',
    permissoes: [
      {
        id: 'usuarios.gerenciar',
        nome: 'Usuários',
        descricao: 'Cadastrar pessoas, trocar o perfil de acesso, os setores e ativar ou desativar contas.',
      },
      {
        id: 'perfis.gerenciar',
        nome: 'Perfis de acesso',
        descricao: 'Criar perfis e escolher as permissões de cada um.',
      },
      {
        id: 'notificacoes.enviar',
        nome: 'Enviar notificações',
        descricao: 'Disparar comunicados para um perfil, um setor, uma pessoa ou todo mundo.',
      },
    ],
  },
];

/** Todos os ids válidos, achatados. */
export const PERMISSOES: readonly string[] = CATALOGO_PERMISSOES.flatMap((g) =>
  g.permissoes.map((p) => p.id),
);

const CONHECIDAS = new Set(PERMISSOES);

export const permissaoExiste = (id: string): boolean => CONHECIDAS.has(id);

/** Ids recebidos que não existem no catálogo — o que a API devolve no 400. */
export function permissoesDesconhecidas(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => !CONHECIDAS.has(id)))];
}

/** Ordena e desduplica na ordem do catálogo, para o banco não guardar a
 *  ordem em que os checkboxes foram clicados. */
export function normalizarPermissoes(ids: readonly string[]): string[] {
  const pedidas = new Set(ids);
  return PERMISSOES.filter((p) => pedidas.has(p));
}

/** Permissão de ver o hub `chave`. Uma função em vez de template solto para
 *  o formato viver num lugar só. */
export const permissaoDoSetor = (chave: string): string => `setor.${chave}.ver`;
