-- Remove somente registros explicitamente marcados como demonstração.
DELETE FROM compra_solicitacoes
 WHERE titulo LIKE '[DEMO]%' ESCAPE ''
    OR observacoes = '[DEMO]';
