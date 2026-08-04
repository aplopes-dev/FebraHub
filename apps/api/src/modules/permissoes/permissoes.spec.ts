/**
 * O que quebra em silêncio no sistema de permissões — e por isso está testado:
 *
 *  1. os perfis padrão vivem em DOIS lugares (perfis-padrao.ts e a migration
 *     14, que é a que roda em produção). Se um mudar sem o outro, o servidor
 *     recebe permissões diferentes das do ambiente local;
 *  2. os dois eixos de acesso (setor do cadastro × permissão do perfil) se
 *     somam em podeVer — um "ou" trocado por "e" fecharia hubs inteiros sem
 *     nenhum erro aparecer;
 *  3. o fallback de quem não tem perfil, que é o caminho de qualquer conta
 *     criada fora da tela.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { temPermissao } from '../../common/guards/permissao.guard';
import { podeVer } from '../../common/guards/setor.guard';
import { PERMISSOES, normalizarPermissoes, permissoesDesconhecidas } from './catalogo';
import { permissoesEfetivas } from './efetivas';
import { PERFIS_PADRAO } from './perfis-padrao';

const migration = (pasta: string): string =>
  readFileSync(join(__dirname, `../../../prisma/migrations/${pasta}/migration.sql`), 'utf8');

/** As permissões do INSERT inicial, por slug. */
function permissoesDaMigration14(slug: string): string[] {
  const sql = migration('00000000000014_permissoes_notificacoes');
  const trecho = sql.slice(sql.indexOf('INSERT INTO public.perfis_acesso'));
  const bloco = trecho.slice(trecho.indexOf(`('${slug}',`));
  const fim = bloco.indexOf('])');
  if (fim < 0) return [];
  return [...bloco.slice(0, fim).matchAll(/'([a-z]+\.[a-z.]+)'/g)].map((m) => m[1]);
}

/** Os pares (slug, permissão) que a migration aditiva acrescenta. */
function adicoesDaMigration16(slug: string): string[] {
  const sql = migration('00000000000016_brain_permissoes');
  return [...sql.matchAll(/\('([a-z-]+)',\s*'([a-z]+\.[a-z.]+)'\)/g)]
    .filter((m) => m[1] === slug)
    .map((m) => m[2]);
}

const usuario = (p: Partial<UsuarioLogado>): UsuarioLogado => ({
  id: 'u',
  email: 'a@b.c',
  nome: 'Alguém',
  papel: 'membro',
  setor: 'comercial',
  setores: ['comercial'],
  permissoes: [],
  perfilAcesso: null,
  ...p,
});

describe('catálogo', () => {
  it('não tem id repetido', () => {
    expect(new Set(PERMISSOES).size).toBe(PERMISSOES.length);
  });

  it('recusa id que não existe e aceita os que existem', () => {
    expect(permissoesDesconhecidas(['executivo.ver', 'inventada.agora'])).toEqual(['inventada.agora']);
    expect(permissoesDesconhecidas([...PERMISSOES])).toEqual([]);
  });

  it('normaliza na ordem do catálogo, sem repetição', () => {
    const bagunçada = ['organograma.ver', 'executivo.ver', 'organograma.ver'];
    expect(normalizarPermissoes(bagunçada)).toEqual(['executivo.ver', 'organograma.ver']);
  });
});

describe('perfis padrão', () => {
  it('só concede permissão que existe no catálogo', () => {
    for (const p of PERFIS_PADRAO) {
      expect(permissoesDesconhecidas(p.permissoes)).toEqual([]);
    }
  });

  it('tem exatamente um perfil de sistema, o admin, com o catálogo inteiro', () => {
    const sistema = PERFIS_PADRAO.filter((p) => p.sistema);
    expect(sistema.map((p) => p.slug)).toEqual(['admin']);
    expect([...sistema[0].permissoes].sort()).toEqual([...PERMISSOES].sort());
  });

  // As migrations são o que chega ao servidor: a imagem da API não tem
  // ts-node para rodar o seed. Divergir delas é divergir da produção.
  //
  // São DUAS porque a 14 já rodou em produção e perfil existente não é
  // reescrito — permissão nova de um subsistema novo entra por migration
  // aditiva. O estado esperado é a união das duas.
  it('bate com o que as migrations semeiam', () => {
    for (const perfil of PERFIS_PADRAO) {
      const esperado = new Set([...permissoesDaMigration14(perfil.slug), ...adicoesDaMigration16(perfil.slug)]);
      // O admin não é semeado por migration aditiva: onModuleInit sincroniza
      // ele com o catálogo inteiro a cada boot.
      if (perfil.sistema) continue;
      expect([...esperado].sort()).toEqual([...perfil.permissoes].sort());
    }
  });
});

describe('permissoesEfetivas', () => {
  it('dá o catálogo inteiro a quem é admin', () => {
    const r = permissoesEfetivas({ papel: 'admin', setor: 'geral', setores: [], perfilAcesso: null });
    expect(r).toEqual([...PERMISSOES]);
  });

  it('dá o catálogo inteiro a quem tem o setor geral', () => {
    const r = permissoesEfetivas({ papel: 'membro', setor: 'geral', setores: ['geral'], perfilAcesso: null });
    expect(r).toEqual([...PERMISSOES]);
  });

  it('usa as permissões do perfil, descartando id órfão', () => {
    const r = permissoesEfetivas({
      papel: 'membro',
      setor: 'comercial',
      setores: ['comercial'],
      perfilAcesso: { permissoes: ['organograma.ver', 'permissao.de.uma.versao.antiga'] },
    });
    expect(r).toEqual(['organograma.ver']);
  });

  it('sem perfil, cai no fallback derivado dos setores', () => {
    const r = permissoesEfetivas({
      papel: 'membro',
      setor: 'financeiro',
      setores: ['financeiro', 'comercial'],
      perfilAcesso: null,
    });
    expect(r).toEqual(['setor.comercial.ver', 'setor.financeiro.ver']);
  });
});

describe('temPermissao', () => {
  it('exige UMA das permissões, não todas', () => {
    const u = usuario({ permissoes: ['integracoes.ver'] });
    expect(temPermissao(u, ['integracoes.ver', 'integracoes.gerenciar'])).toBe(true);
    expect(temPermissao(u, ['integracoes.gerenciar'])).toBe(false);
  });

  it('admin atravessa mesmo com a lista vazia', () => {
    expect(temPermissao(usuario({ papel: 'admin', permissoes: [] }), ['perfis.gerenciar'])).toBe(true);
  });
});

describe('podeVer — os dois eixos somados', () => {
  it('libera pelo setor do cadastro', () => {
    expect(podeVer(usuario({ setor: 'loja', setores: ['loja'] }), ['loja'])).toBe(true);
  });

  it('libera pela permissão do perfil, mesmo sem o setor no cadastro', () => {
    const u = usuario({ setor: 'comercial', setores: ['comercial'], permissoes: ['setor.financeiro.ver'] });
    expect(podeVer(u, ['financeiro'])).toBe(true);
  });

  it('nega quando nenhum dos dois responde', () => {
    const u = usuario({ setor: 'comercial', setores: ['comercial'], permissoes: ['organograma.ver'] });
    expect(podeVer(u, ['financeiro'])).toBe(false);
  });

  it('geral e admin continuam vendo tudo', () => {
    expect(podeVer(usuario({ setor: 'geral', setores: ['geral'] }), ['estoque'])).toBe(true);
    expect(podeVer(usuario({ papel: 'admin', setores: [] }), ['estoque'])).toBe(true);
  });
});
