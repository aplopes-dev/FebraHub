-- ====================================================================
-- FebraHub · Migration 54 — REMOVE Instagram (login direto / aiograpi-rest)
--
-- Reverte a migration 52: a integração Instagram por login direto foi
-- descartada. O Zernio (social_config) já cobre o Instagram oficial
-- (publicação, análise, DMs, campanhas Meta) pela via oficial, sem violar os
-- ToS — o aiograpi (API privada) era redundante e trazia risco de bloqueio da
-- conta. Dropamos a tabela; a 52 permanece no histórico (migração forward).
-- ====================================================================

DROP TABLE IF EXISTS public.instagram_config;
