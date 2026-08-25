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
    id: 'compras', nome: 'Compras e Estoque', descricao: 'Fluxo operacional da solicitação ao recebimento e encerramento.',
    permissoes: [
      { id: 'compras.ver', nome: 'Consultar solicitações', descricao: 'Acompanhar solicitações de compras e materiais.' },
      { id: 'compras.solicitar', nome: 'Solicitar materiais', descricao: 'Abrir e enviar novas solicitações.' },
      { id: 'compras.operar', nome: 'Operar compras e estoque', descricao: 'Analisar, cotar, emitir pedido, receber e entregar.' },
      { id: 'compras.aprovar', nome: 'Aprovar compras', descricao: 'Aprovar ou recusar compras submetidas à alçada.' },
    ],
  },
  {
    id: 'pdv', nome: 'PDV — Ponto de Venda', descricao: 'Frente de caixa interna: abrir/fechar caixa, vender e acompanhar.',
    permissoes: [
      { id: 'pdv.ver', nome: 'Acompanhar o PDV', descricao: 'Ver vendas, indicadores e sessões de caixa.' },
      { id: 'pdv.operar', nome: 'Operar o caixa', descricao: 'Abrir/fechar caixa, sangria/reforço e registrar vendas.' },
      { id: 'pdv.gerenciar', nome: 'Gerenciar o PDV', descricao: 'Cancelar vendas e administrar terminais.' },
    ],
  },
  {
    id: 'loja-catalogo', nome: 'Loja — Catálogo e Estoque', descricao: 'Produtos, categorias e estoque operacional da Loja (LOJA/DEPÓSITO), base do PDV e do Cardápio Digital.',
    permissoes: [
      { id: 'loja.produtos.ver', nome: 'Consultar o catálogo', descricao: 'Ver produtos, categorias, saldos e movimentações de estoque.' },
      { id: 'loja.produtos.gerenciar', nome: 'Gerenciar o catálogo', descricao: 'Criar/editar produtos e categorias, ajustar e transferir estoque entre LOJA e DEPÓSITO.' },
    ],
  },
  {
    id: 'loja-pedidos', nome: 'Loja — Pedidos e Fila', descricao: 'Cardápio digital, fila de preparação e retirada da operação da Loja.',
    permissoes: [
      { id: 'loja.pedidos.ver', nome: 'Acompanhar pedidos', descricao: 'Ver a fila, os pedidos, o painel/TV e os indicadores da operação.' },
      { id: 'loja.pedidos.operar', nome: 'Operar a fila', descricao: 'Confirmar pagamento, chamar o próximo, preparar, marcar pronto e confirmar retirada.' },
      { id: 'loja.pedidos.gerenciar', nome: 'Gerenciar operações', descricao: 'Abrir/encerrar operações da Loja e cancelar pedidos.' },
    ],
  },
  {
    id: 'fiscal', nome: 'Fiscal — Cupom e Nota', descricao: 'Emissão de cupom fiscal (NFC-e) e comprovante não fiscal, e a configuração do emitente.',
    permissoes: [
      { id: 'fiscal.emitir', nome: 'Emitir cupom', descricao: 'Emitir e reimprimir cupom fiscal (NFC-e) e comprovante não fiscal a partir de uma venda.' },
      { id: 'fiscal.gerenciar', nome: 'Configurar o fiscal', descricao: 'Cadastrar certificado A1, CSC e os dados do emitente; cancelar notas; trocar ambiente.' },
    ],
  },
  {
    id: 'financeiro-erp', nome: 'Financeiro ERP', descricao: 'Contas a pagar/receber, DRE, contas bancárias e centros de custo.',
    permissoes: [
      { id: 'financeiro.erp.ver', nome: 'Consultar o financeiro', descricao: 'Ver lançamentos, DRE, saldos e indicadores.' },
      { id: 'financeiro.gerenciar', nome: 'Lançar e liquidar', descricao: 'Criar lançamentos, dar baixa e manter os cadastros de apoio.' },
    ],
  },
  {
    id: 'processos',
    nome: 'Central de Processos',
    descricao: 'Mapeamento, validação, publicação e implantação do ERP.',
    permissoes: [
      { id: 'processos.ver', nome: 'Consultar processos', descricao: 'Ver processos e manuais permitidos para seus setores.' },
      { id: 'processos.mapear', nome: 'Mapear processos', descricao: 'Criar e editar entrevistas, fluxos e rascunhos.' },
      { id: 'processos.validar', nome: 'Validar processos', descricao: 'Solicitar ajustes, rejeitar ou aprovar versões.' },
      { id: 'processos.administrar', nome: 'Administrar a Central', descricao: 'Arquivar, restaurar versões e configurar a Central.' },
      { id: 'processos.implantacao', nome: 'Implantação do ERP', descricao: 'Acessar entregas, cronograma, impedimentos e decisões.' },
    ],
  },
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
    id: 'brain',
    nome: 'Memória institucional',
    descricao:
      'A base de conhecimento do GBrain. O que cada pessoa alcança são as fontes dos setores dela — as permissões abaixo dizem o que ela pode FAZER com elas.',
    permissoes: [
      {
        id: 'brain.ver',
        nome: 'Consultar a memória',
        descricao: 'Buscar e pedir respostas com citação. Só nas fontes dos setores que a pessoa alcança.',
      },
      {
        id: 'brain.enviar',
        nome: 'Registrar conhecimento',
        descricao: 'Gravar novas páginas na fonte do próprio setor.',
      },
      {
        id: 'brain.gerenciar',
        nome: 'Administrar a memória',
        descricao: 'Ver o estado das fontes, o volume indexado e revalidar os acessos.',
      },
    ],
  },
  {
    id: 'social',
    nome: 'Redes sociais',
    descricao:
      'O painel do Zernio: contas conectadas, publicação, mensagens diretas e as campanhas pagas. Aqui o recorte NÃO é por setor — a conta do Zernio é uma só, da Febracis Salvador.',
    permissoes: [
      {
        id: 'social.ver',
        nome: 'Acompanhar as redes',
        descricao:
          'Abrir o painel: contas, alcance, postagens publicadas, análise e o desempenho das campanhas.',
      },
      {
        id: 'social.publicar',
        nome: 'Publicar e responder',
        descricao:
          'Criar e agendar postagens, apagar o que ainda não saiu e responder às mensagens diretas.',
      },
      {
        id: 'social.gerenciar',
        nome: 'Configurar a integração',
        descricao:
          'Gravar a chave do Zernio, escolher o perfil padrão e ligar ou desligar campanhas.',
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
