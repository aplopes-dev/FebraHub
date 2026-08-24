-- FR-020: a adesão ao Padrão Nacional passou a ser lida de
-- `companies.national_nfse_enabled` em vez de uma lista de códigos IBGE em
-- código (`SUPPORTED_NFSE_MUNICIPALITIES = ['2913606']`).
--
-- A coluna foi criada com DEFAULT false. Sem este backfill, toda empresa já
-- cadastrada em Ilhéus — que hoje emite normalmente — passaria a ser recusada
-- com 422 no primeiro deploy. O backfill reproduz exatamente a regra anterior,
-- de modo que a troca não muda comportamento algum: só muda onde a decisão mora.
--
-- Restrito a 2913606 de propósito: é o único município cuja adesão está
-- confirmada. Habilitar outros aqui seria inventar um fato cadastral.
UPDATE "fiscal"."companies"
SET "national_nfse_enabled" = true
WHERE "city_code_ibge" = '2913606'
  AND "national_nfse_enabled" = false;
