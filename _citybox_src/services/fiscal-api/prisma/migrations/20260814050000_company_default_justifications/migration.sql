-- Justificativas padrão do Emitente (spec erp/023, N6 — "Justificativas
-- padrão" em Configurações gerais, hoje "Em breve" no frontend).
--
-- Escrita à mão em vez de gerada por `prisma migrate dev`: a shadow database
-- que o Prisma cria on-the-fly não tem `public.citybox_uuid_v7()` (só existe
-- porque `infra/postgres/init/02-citybox-uuid-v7.sql` roda na inicialização
-- do container contra o banco `citybox` real), mesmo precedente já registrado
-- em `20260805012847_fiscal_event_inutilization_fields` e outras migrations
-- deste serviço.
--
-- Nulas e sem default: metadado opcional, instantâneo, sem reescrita de
-- tabela. O comprimento mínimo/máximo (15–255, exigência SEFAZ pro campo
-- `xJust`/`xCorrecao`) é validado na aplicação (`CompanyZodValidator`), não
-- aqui — mesmo padrão do resto do schema desta tabela.
ALTER TABLE "fiscal"."companies"
  ADD COLUMN "inutilization_justification" TEXT,
  ADD COLUMN "cancellation_justification" TEXT;
