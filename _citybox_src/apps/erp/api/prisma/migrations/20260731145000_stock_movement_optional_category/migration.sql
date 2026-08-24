-- Movimentação automática (venda, compra, produção, transferência, inventário) passa a
-- gravar o motivo em `source_type` e a deixar `category_id` nulo. A categoria continua
-- obrigatória na movimentação manual, mas isso é invariante de domínio, não do banco.
--
-- Sem backfill: as movimentações antigas mantêm a categoria que já apontavam.

-- AlterTable
ALTER TABLE "stock_movements" ALTER COLUMN "category_id" DROP NOT NULL;
