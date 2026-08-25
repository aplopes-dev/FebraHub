/**
 * PERFIS PADRÃO — a lista canônica em TypeScript.
 *
 * Ela existe em dois lugares por um motivo de operação, não de gosto: a
 * produção só executa `prisma migrate deploy`, e a imagem da API não carrega
 * ts-node para rodar `npm run seed`. Então os mesmos seis perfis aparecem em
 * migrations/00000000000014_permissoes_notificacoes/migration.sql (é o que
 * chega ao servidor) e aqui, de onde prisma/seed.ts semeia o ambiente local.
 * Mudou um, mude o outro — o teste de permissões compara os dois.
 *
 * `admin` é de sistema: nome, permissões e exclusão ficam travados na API.
 * Os outros cinco existem justamente para serem ajustados na tela.
 */

import { PERMISSOES } from './catalogo';

export interface PerfilPadrao {
  slug: string;
  nome: string;
  descricao: string;
  sistema: boolean;
  permissoes: readonly string[];
}

const TODOS_SETORES = [
  'setor.comercial.ver',
  'setor.financeiro.ver',
  'setor.marketing.ver',
  'setor.pedagogico.ver',
  'setor.eventos.ver',
  'setor.loja.ver',
  'setor.estoque.ver',
  'setor.crm.ver',
] as const;

export const PERFIS_PADRAO: readonly PerfilPadrao[] = [
  {
    slug: 'admin',
    nome: 'Administrador',
    descricao:
      'Acesso total, inclusive à gestão de perfis e usuários. Perfil de sistema — não pode ser editado nem excluído.',
    sistema: true,
    // Tudo que o catálogo conhece, sempre: uma permissão nova nasce concedida
    // ao admin sem ninguém precisar lembrar de marcá-la.
    permissoes: PERMISSOES,
  },
  {
    slug: 'diretoria',
    nome: 'Diretoria',
    descricao: 'Todos os painéis e todos os setores, sem a administração de acessos.',
    sistema: false,
    permissoes: [
      'pedagogico.ver', 'pedagogico.operar', 'pedagogico.gerenciar', 'pedagogico.cs',
      'compras.ver', 'compras.solicitar', 'compras.operar', 'compras.aprovar',
      'pdv.ver', 'pdv.operar', 'pdv.gerenciar',
      'loja.produtos.ver', 'loja.produtos.gerenciar',
      'loja.pedidos.ver', 'loja.pedidos.operar', 'loja.pedidos.gerenciar',
      'fiscal.emitir', 'fiscal.gerenciar',
      'financeiro.erp.ver', 'financeiro.gerenciar',
      'processos.ver',
      'processos.validar',
      'processos.implantacao',
      'executivo.ver',
      'executivo.metas',
      'territorial.ver',
      'organograma.ver',
      'organograma.editar',
      'organograma.cargos.gerenciar',
      ...TODOS_SETORES,
      'integracoes.ver',
      'brain.ver',
      'brain.enviar',
      'brain.gerenciar',
      'social.ver',
      'social.publicar',
      'social.gerenciar',
      'notificacoes.enviar',
    ],
  },
  {
    slug: 'gestor',
    nome: 'Gestor de setor',
    descricao:
      'Hub Executivo com metas e organograma. Os dados continuam recortados pelo setor do cadastro.',
    sistema: false,
    permissoes: [
      'pedagogico.ver', 'pedagogico.operar', 'pedagogico.gerenciar', 'pedagogico.cs',
      'compras.ver', 'compras.solicitar', 'compras.operar', 'compras.aprovar',
      'pdv.ver', 'pdv.operar',
      'loja.produtos.ver', 'loja.produtos.gerenciar',
      'loja.pedidos.ver', 'loja.pedidos.operar', 'loja.pedidos.gerenciar',
      'fiscal.emitir', 'fiscal.gerenciar',
      'financeiro.erp.ver',
      'processos.ver',
      'processos.mapear',
      'processos.validar',
      'executivo.ver',
      'executivo.metas',
      'organograma.ver',
      'brain.ver',
      'brain.enviar',
      'social.ver',
    ],
  },
  {
    slug: 'equipe',
    nome: 'Equipe',
    descricao: 'O hub do próprio setor e o organograma. É o perfil padrão de quem entra.',
    sistema: false,
    permissoes: ['pedagogico.ver', 'pedagogico.operar', 'pedagogico.monitores', 'compras.ver', 'compras.solicitar', 'loja.produtos.ver', 'loja.pedidos.ver', 'loja.pedidos.operar', 'fiscal.emitir', 'processos.ver', 'organograma.ver', 'brain.ver'],
  },
  {
    slug: 'integracoes',
    nome: 'Integrações e TI',
    descricao: 'Conexões das fontes, WhatsApp, agentes de IA e cadastro de usuários.',
    sistema: false,
    permissoes: [
      'integracoes.ver',
      'integracoes.gerenciar',
      'whatsapp.gerenciar',
      'agentes.gerenciar',
      'setor.crm.ver',
      'brain.gerenciar',
      'social.ver',
      'social.gerenciar',
      'usuarios.gerenciar',
    ],
  },
  {
    slug: 'consulta',
    nome: 'Somente leitura',
    descricao: 'Abre os painéis da diretoria sem poder alterar nada.',
    sistema: false,
    permissoes: ['processos.ver', 'executivo.ver', 'territorial.ver', 'organograma.ver', 'brain.ver', 'social.ver'],
  },
];

/** Perfil de quem entra sem nada indicado — e o que a migration atribui a
 *  todo usuário que já existia e não é admin. */
export const PERFIL_PADRAO_NOVO_USUARIO = 'equipe';
