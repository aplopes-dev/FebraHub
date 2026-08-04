/**
 * FebraHub · seed dos usuários migrados do Supabase Auth
 *
 * Rodar:  npm run seed          (de apps/api)
 *
 * `npx prisma db seed` só funciona se package.json ganhar o bloco de topo
 * `"prisma": { "seed": "ts-node prisma/seed.ts" }` — hoje o comando existe
 * apenas em `scripts`.
 *
 * POR QUE TODO MUNDO NASCE COM SENHA TEMPORÁRIA
 * A Admin API do Supabase (`GET /auth/v1/admin/users`) devolve id, e-mail, datas
 * e metadata — mas NÃO devolve `encrypted_password`. Não existe caminho suportado
 * para exportar o hash. Ou seja: a senha que essas 6 pessoas usavam não veio na
 * migração e não tem como vir.
 *
 * A saída errada seria inventar uma senha padrão igual para todo mundo ("Febracis@2026"),
 * que vaza no primeiro print de tela e continua valendo meses depois. A saída certa é
 * cada conta nascer com uma senha ALEATÓRIA, exibida UMA VEZ no stdout de quem roda o
 * seed, e com `precisaTrocarSenha = true` — na primeira entrada a pessoa troca e a
 * temporária morre ali.
 *
 * O seed é reexecutável: se a conta já existe, ele NÃO toca na senha, no papel nem no
 * setor. Quem já entrou e trocou a senha não é afetado por uma segunda execução, e
 * promoção/desligamento feitos na aplicação não são desfeitos por um `db seed` distraído.
 */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PERFIS_PADRAO, PERFIL_PADRAO_NOVO_USUARIO } from '../src/modules/permissoes/perfis-padrao';

const prisma = new PrismaClient();

/**
 * Mesma configuração do AuthService. Se mudar em um lugar, mude no outro:
 * hash gerado com parâmetro diferente do de verificação não confere.
 * Estes são os valores do OWASP para argon2id (19 MiB, 2 iterações, 1 thread).
 *
 * Sem anotação de tipo de propósito: o nome do tipo de opções mudou entre
 * versões do argon2 (`Options` → `HashOptions`) e amarrar o seed a um deles
 * quebra o build na primeira atualização do pacote.
 */
const ARGON = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

interface UsuarioSemente {
  email: string;
  nome: string;
  papel: 'admin' | 'gestor' | 'membro';
  setor: string;
  /** Setores além do próprio. Ver PerfilSetor no schema. */
  setoresExtras?: string[];
  /** Slug do perfil de acesso. Ausente = PERFIL_PADRAO_NOVO_USUARIO. */
  perfil?: string;
}

/**
 * Perfis de acesso — os mesmos seis de
 * src/modules/permissoes/perfis-padrao.ts, que é a lista canônica.
 *
 * A produção NÃO passa por aqui: a imagem da API não carrega ts-node, então
 * quem semeia lá é a migration 00000000000014 (mesmas linhas, em SQL). Este
 * caminho serve ao ambiente local e a qualquer banco recriado do zero.
 *
 * Cria o que falta e NÃO reescreve o que existe — mesma regra dos usuários:
 * permissão ajustada na tela não é desfeita por um `npm run seed` distraído.
 * A única exceção é o perfil `admin`, que sempre recebe o catálogo inteiro
 * (ver PermissoesService.onModuleInit, que faz o mesmo no boot da API).
 */
async function semearPerfis(): Promise<number> {
  let criados = 0;
  for (const p of PERFIS_PADRAO) {
    const existente = await prisma.perfilAcesso.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });
    if (existente) {
      if (p.sistema) {
        await prisma.perfilAcesso.update({
          where: { id: existente.id },
          data: { permissoes: [...p.permissoes] },
        });
      }
      console.log(`existente perfil ${p.slug.padEnd(12)} — permissões preservadas`);
      continue;
    }
    await prisma.perfilAcesso.create({
      data: {
        slug: p.slug,
        nome: p.nome,
        descricao: p.descricao,
        sistema: p.sistema,
        permissoes: [...p.permissoes],
      },
    });
    criados += 1;
    console.log(`criado    perfil ${p.slug.padEnd(12)} (${p.permissoes.length} permissões)`);
  }
  return criados;
}

/**
 * Os 6 usuários que existiam no Supabase Auth em 01/08/2026, com o papel e o
 * setor que estavam em `public.perfis`. E-mail é a chave: o uuid antigo do
 * Supabase foi descartado de propósito — ele só fazia sentido apontando para
 * auth.users, que não existe mais.
 */
const USUARIOS: UsuarioSemente[] = [
  {
    email: 'dulcemariano@febracis.com.br',
    nome: 'Dulce Mariano',
    papel: 'admin',
    setor: 'geral',
    perfil: 'admin',
  },
  {
    email: 'financeiro@febracis.com',
    nome: 'Bruna Souza',
    papel: 'membro',
    setor: 'financeiro',
    // Vinha assim de perfil_setores no Supabase. 'financeiro' repete o setor
    // primário e é redundante — fica porque é o dado real migrado, e porque a
    // consulta de permissão faz UNION dos dois lugares sem se importar.
    setoresExtras: ['comercial', 'financeiro'],
  },
  {
    email: 'pedagogicobahia@febracis.com.br',
    nome: 'Elis Figueiredo',
    papel: 'membro',
    setor: 'pedagogico',
  },
  {
    email: 'centroconceitobahia@febracis.com.br',
    nome: 'Jessica Pita',
    papel: 'membro',
    setor: 'loja',
  },
  {
    email: 'marketingbahia@febracis.com.br',
    nome: 'Bruno Cordeiro',
    papel: 'membro',
    setor: 'marketing',
  },
  {
    email: 'comercialbahia2@febracis.com.br',
    nome: 'Carmen Acassia',
    papel: 'membro',
    setor: 'comercial',
  },
];

/** E-mail da conta de teste. Nome auto-explicativo para ninguém confundir com gente. */
const EMAIL_QA = 'qa.migracao@febracis.com.br';

/**
 * 96 bits de entropia em base64url: 16 caracteres, sem `+`, `/` ou `=` para
 * não quebrar ao ser copiada de um chat ou de um terminal.
 */
function senhaTemporaria(): string {
  return randomBytes(12).toString('base64url');
}

/**
 * Cria se não existe; se existe, não mexe em nada.
 * Devolve a senha temporária quando criou, ou null quando a conta já estava lá.
 */
async function semear(u: UsuarioSemente, senhaFixa?: string): Promise<string | null> {
  // O upsert sozinho não diz se criou ou atualizou, e é isso que decide se a
  // senha vai para o stdout. Daí a consulta antes.
  const existente = await prisma.usuario.findUnique({
    where: { email: u.email },
    select: { id: true, perfilAcessoId: true },
  });

  const senha = senhaFixa ?? senhaTemporaria();
  const perfil = await prisma.perfilAcesso.findUnique({
    where: { slug: u.perfil ?? PERFIL_PADRAO_NOVO_USUARIO },
    select: { id: true },
  });

  const usuario = await prisma.usuario.upsert({
    where: { email: u.email },
    create: {
      email: u.email,
      nome: u.nome,
      senhaHash: await argon2.hash(senha, ARGON),
      papel: u.papel,
      setor: u.setor,
      perfilAcessoId: perfil?.id ?? null,
      ativo: true,
      // Só a conta de QA nasce sem a trava: ela é usada de novo a cada validação,
      // e forçar troca na primeira entrada acabaria com a utilidade dela.
      precisaTrocarSenha: senhaFixa === undefined,
    },
    // Vazio de propósito: o seed semeia, não reafirma estado. Se alguém virou
    // gestor pela aplicação ou foi desativado, um `db seed` não desfaz.
    update: {},
  });

  if (u.setoresExtras?.length) {
    // Aditivo e idempotente. Tirar acesso é ação da aplicação, com registro em
    // auditoria — nunca efeito colateral de seed.
    await prisma.perfilSetor.createMany({
      data: u.setoresExtras.map((setor) => ({ usuarioId: usuario.id, setor })),
      skipDuplicates: true,
    });
  }

  // Conta que já existia SEM perfil (banco anterior à migration 14) ganha o
  // dela agora. Quem já tem um perfil atribuído não é mexido: trocar perfil
  // é decisão de quem administra, não de um seed.
  if (existente && !existente.perfilAcessoId && perfil) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { perfilAcessoId: perfil.id },
    });
    console.log(`vinculado ${u.email.padEnd(38)} ao perfil ${u.perfil ?? PERFIL_PADRAO_NOVO_USUARIO}`);
  }

  return existente ? null : senha;
}

async function main(): Promise<void> {
  const criadas: Array<{ email: string; senha: string }> = [];
  let jaExistiam = 0;

  // Antes dos usuários: semear na ordem inversa deixaria todo mundo sem perfil.
  const perfisCriados = await semearPerfis();

  for (const u of USUARIOS) {
    const senha = await semear(u);
    if (senha) {
      criadas.push({ email: u.email, senha });
      console.log(`criado   ${u.email}  (${u.papel}/${u.setor})`);
    } else {
      jaExistiam += 1;
      console.log(`existente ${u.email}  — senha, papel e setor preservados`);
    }
  }

  // Conta de QA: valida login, troca de senha, upload e permissão em PRODUÇÃO
  // sem que ninguém precise usar a conta da Dulce para testar.
  // A senha vem de env porque quem valida precisa saber qual é — e porque
  // senha fixa em arquivo versionado é senha vazada.
  const senhaQa = process.env.SEED_QA_SENHA;
  if (senhaQa) {
    const senha = await semear(
      {
        email: EMAIL_QA,
        nome: 'QA Migração',
        papel: 'membro',
        setor: 'comercial',
      },
      senhaQa,
    );
    console.log(
      senha
        ? `criado   ${EMAIL_QA}  (membro/comercial, senha de SEED_QA_SENHA)`
        : `existente ${EMAIL_QA}  — senha preservada`,
    );
  } else {
    console.log(`pulado   ${EMAIL_QA}  — defina SEED_QA_SENHA para criar a conta de teste`);
  }

  if (criadas.length) {
    // Este bloco aparece UMA vez, na criação. Não há como recuperar estas senhas
    // depois: o banco só guarda o hash argon2id.
    console.log('\n' + '='.repeat(72));
    console.log('SENHAS TEMPORÁRIAS — anote agora, não são exibidas de novo.');
    console.log('Entregue cada uma pessoalmente. Todas exigem troca no primeiro login.');
    console.log('='.repeat(72));
    for (const { email, senha } of criadas) {
      console.log(`  ${email.padEnd(38)} ${senha}`);
    }
    console.log('='.repeat(72) + '\n');
  }

  console.log(
    `resumo: ${criadas.length} usuário(s) criado(s), ${jaExistiam} já existia(m), ` +
      `${perfisCriados} perfil(is) de acesso criado(s)`,
  );
}

main()
  .catch((e) => {
    console.error('seed falhou:', e);
    // Sair com código != 0 para o deploy abortar. Seed que falha calado deixa o
    // sistema no ar sem ninguém conseguir entrar.
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
