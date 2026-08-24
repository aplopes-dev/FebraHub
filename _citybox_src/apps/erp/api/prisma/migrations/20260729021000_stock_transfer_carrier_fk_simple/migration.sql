-- Troca FK composta (carrier_id, organization_id) por FK simples em carrier_id.
-- SET NULL em FK composta tentaria zerar organization_id (NOT NULL) ao apagar Carrier.
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_carrier_id_organization_id_fkey";

ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
