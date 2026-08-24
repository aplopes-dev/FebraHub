-- AlterTable
ALTER TABLE "sale_order_lines" ADD COLUMN     "description" TEXT,
ALTER COLUMN "product_id" DROP NOT NULL;

-- Defesa em profundidade: a regra "produto XOR description" já vive no
-- domínio (SaleOrder.entity.ts normalizeLines) — este CHECK garante que
-- nenhum caminho de escrita (script, migração futura, bug) contorne a regra.
ALTER TABLE "sale_order_lines"
  ADD CONSTRAINT "sale_order_lines_product_or_description_check"
  CHECK (
    ("product_id" IS NOT NULL AND "description" IS NULL) OR
    ("product_id" IS NULL AND "description" IS NOT NULL)
  );
