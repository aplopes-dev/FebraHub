ALTER TABLE compra_solicitacoes DROP CONSTRAINT compra_situacao_check;
ALTER TABLE compra_solicitacoes ADD CONSTRAINT compra_situacao_check CHECK (situacao IN (
  'rascunho','enviada','aguardando_analise','aguardando_complementacao','verificacao_estoque',
  'atendida_estoque','em_cotacao','aguardando_aprovacao','ajustes_solicitados','aprovada',
  'reprovada','pedido_emitido','aguardando_entrega','recebida_parcialmente','recebida',
  'pronta_entrega','entregue','encerrada','cancelada',
  'devolvida','recusada','aguardando_prioridade','recebimento','divergencia','entrada_estoque'
));
