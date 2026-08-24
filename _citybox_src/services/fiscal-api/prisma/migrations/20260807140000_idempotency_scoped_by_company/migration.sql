-- Isolamento de tenant na chave de idempotência (Constituição V).
--
-- A chave é escolhida pelo ERP, não por nós: nada impede duas empresas de
-- usarem "PEDIDO-0001". Sem `company_id` na unique, `findByIdempotency`
-- devolvia à empresa B o documento fiscal da empresa A — com chave de acesso,
-- protocolo, valores e itens de outro contribuinte.
--
-- Verificado em 2026-08-07: uma emissão para a empresa `bf81b277…` recebeu de
-- volta um documento de `dd2dd1fd…`.
--
-- A troca só ALARGA a unicidade (mais colunas = menos colisões), então nenhuma
-- linha existente pode violar a nova constraint — não há risco de falha por
-- dado legado.
DROP INDEX IF EXISTS "fiscal"."fiscal_documents_source_system_external_reference_document__key";

CREATE UNIQUE INDEX "fiscal_documents_company_source_external_type_idem_key"
  ON "fiscal"."fiscal_documents" (
    "company_id", "source_system", "external_reference", "document_type", "idempotency_key"
  );
