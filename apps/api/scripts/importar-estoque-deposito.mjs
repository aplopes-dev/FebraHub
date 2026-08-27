/**
 * Importa o estoque do DEPÓSITO a partir da planilha de referência
 * docs/referencias/controle-estoque-salvador-apostilas.xlsx
 * (já convertida para ./estoque-deposito-apostilas.json, que é o que este
 * script realmente lê).
 *
 * REGRAS (não misturar com o estoque da LOJA):
 *   - Cada apostila/material vira um LojaProduto marcado como item de DEPÓSITO:
 *     vendePdv=false, exibeCardapio=false, controlaEstoque=true, preco=0.
 *   - O saldo entra em loja_estoque_saldos com local='DEPOSITO'; o local 'LOJA'
 *     fica em 0. Assim o item nunca aparece no PDV/Cardápio (que operam a LOJA).
 *   - Quantidade = saldo líquido dos movimentos (ENTRADA - SAIDA - PERDA),
 *     com piso 0 (a planilha tem alguns itens que fecham negativo por falta de
 *     saldo inicial nos movimentos; a divergência fica registrada na observação).
 *   - Cada produto ganha um movimento 'inventario' (origem 'manual') com o rastro.
 *
 * IDEMPOTENTE: casa produto por (nome, categoria de depósito). Rodar de novo
 * apenas re-sincroniza o saldo, sem duplicar produto.
 *
 * Uso (dentro do container da API):
 *   node scripts/importar-estoque-deposito.mjs /caminho/itens.json [--commit]
 * O JSON é [{nome, cat:'Apostilas'|'Materiais', qtd:Number}, ...].
 * Sem --commit, roda em modo simulação (dry-run) e não grava nada.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync } from 'node:fs';

const prisma = new PrismaClient();
const D = (n) => new Prisma.Decimal(n);

const CATEGORIAS = {
  Apostilas: { nome: 'Apostilas', descricao: 'Apostilas — estoque de depósito', ordem: 50 },
  Materiais: { nome: 'Materiais (Depósito)', descricao: 'Materiais de eventos e operação — estoque de depósito', ordem: 51 },
};

async function garantirCategoria(chave) {
  const def = CATEGORIAS[chave];
  const existe = await prisma.lojaCategoria.findFirst({ where: { nome: def.nome } });
  if (existe) return existe;
  return prisma.lojaCategoria.create({ data: def });
}

async function main() {
  const arquivo = process.argv[2];
  const commit = process.argv.includes('--commit');
  if (!arquivo) throw new Error('Informe o caminho do JSON de itens.');
  const itens = JSON.parse(readFileSync(arquivo, 'utf8'));

  console.log(`Itens no arquivo: ${itens.length} | modo: ${commit ? 'COMMIT' : 'DRY-RUN'}`);

  const cats = {};
  if (commit) {
    for (const chave of Object.keys(CATEGORIAS)) cats[chave] = await garantirCategoria(chave);
  }

  let criados = 0, atualizados = 0, comSaldo = 0, negativos = 0, totalQtd = 0;

  for (const it of itens) {
    const nome = String(it.nome).replace(/\s+/g, ' ').trim();
    const chaveCat = it.cat === 'Apostilas' ? 'Apostilas' : 'Materiais';
    const bruto = Number(it.qtd) || 0;
    const qtd = Math.max(0, bruto);
    if (bruto < 0) negativos++;
    if (qtd > 0) { comSaldo++; totalQtd += qtd; }

    if (!commit) continue;

    const categoriaId = cats[chaveCat].id;
    let produto = await prisma.lojaProduto.findFirst({ where: { nome, categoriaId } });
    if (!produto) {
      produto = await prisma.lojaProduto.create({
        data: {
          nome,
          categoriaId,
          descricao: '',
          preco: D(0),
          unidade: 'un',
          ativo: true,
          vendePdv: false,
          exibeCardapio: false,
          precisaPreparacao: false,
          controlaEstoque: true,
          estoqueMinimo: D(0),
        },
      });
      criados++;
    } else {
      atualizados++;
    }

    // saldos: DEPOSITO = qtd, LOJA = 0 (sem tocar se já existir com saldo)
    await prisma.lojaEstoqueSaldo.upsert({
      where: { produtoId_local: { produtoId: produto.id, local: 'DEPOSITO' } },
      create: { produtoId: produto.id, local: 'DEPOSITO', saldoFisico: D(qtd), reservado: D(0) },
      update: { saldoFisico: D(qtd) },
    });
    await prisma.lojaEstoqueSaldo.upsert({
      where: { produtoId_local: { produtoId: produto.id, local: 'LOJA' } },
      create: { produtoId: produto.id, local: 'LOJA', saldoFisico: D(0), reservado: D(0) },
      update: {},
    });

    const obs = bruto < 0
      ? `Importação planilha depósito. Saldo de movimentos = ${bruto} (negativo por falta de saldo inicial na planilha); ajustado para 0.`
      : `Importação planilha depósito. Saldo de movimentos (ENTRADA-SAIDA-PERDA) = ${qtd}.`;
    await prisma.lojaEstoqueMovimento.create({
      data: {
        produtoId: produto.id,
        local: 'DEPOSITO',
        tipo: 'inventario',
        quantidade: D(qtd),
        saldoApos: D(qtd),
        origem: 'manual',
        referenciaId: 'import:planilha-deposito',
        observacao: obs,
      },
    });
  }

  console.log(`\nResumo: comSaldo=${comSaldo} negativos(->0)=${negativos} totalQtd=${totalQtd}`);
  if (commit) console.log(`Produtos criados=${criados} atualizados=${atualizados}`);
  else console.log('(dry-run — nada gravado; use --commit para aplicar)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
