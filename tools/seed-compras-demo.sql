-- Dados isolados de demonstração. Idempotente e removível por remove-compras-demo.sql.
DO $$
DECLARE u uuid; s uuid; ano text := extract(year from current_date)::text;
BEGIN
  SELECT id INTO u FROM usuarios WHERE ativo ORDER BY (papel='admin') DESC, criado_em LIMIT 1;
  IF u IS NULL THEN RAISE EXCEPTION 'Nenhum usuário ativo'; END IF;
  INSERT INTO compra_solicitacoes(id,protocolo,titulo,tipo,justificativa,setor,prioridade,situacao,solicitante_id,responsavel_id,centro_custo,data_necessaria,observacoes)
  VALUES
   (gen_random_uuid(),'SC-'||ano||'-90001','[DEMO] Materiais aguardando análise','material','Demonstração removível','eventos','normal','aguardando_analise',u,null,'CC-DEMO',current_date+7,'[DEMO]'),
   (gen_random_uuid(),'SC-'||ano||'-90002','[DEMO] Kits em cotação','produto','Demonstração removível','pedagogico','alta','em_cotacao',u,u,'CC-DEMO',current_date+5,'[DEMO]'),
   (gen_random_uuid(),'SC-'||ano||'-90003','[DEMO] Serviço aguardando aprovação','servico','Demonstração removível','marketing','alta','aguardando_aprovacao',u,u,'CC-DEMO',current_date+4,'[DEMO]'),
   (gen_random_uuid(),'SC-'||ano||'-90004','[DEMO] Equipamentos com pedido emitido','produto','Demonstração removível','comercial','normal','pedido_emitido',u,u,'CC-DEMO',current_date+10,'[DEMO]'),
   (gen_random_uuid(),'SC-'||ano||'-90005','[DEMO] Materiais aguardando recebimento','material','Demonstração removível','financeiro','urgente','aguardando_entrega',u,u,'CC-DEMO',current_date+2,'[DEMO]'),
   (gen_random_uuid(),'SC-'||ano||'-90006','[DEMO] Material atendido pelo estoque','material','Demonstração removível','eventos','normal','atendida_estoque',u,u,'CC-DEMO',current_date+1,'[DEMO]')
  ON CONFLICT(protocolo) DO NOTHING;
  FOR s IN SELECT id FROM compra_solicitacoes WHERE protocolo LIKE 'SC-'||ano||'-9000%'
  LOOP
    INSERT INTO compra_itens(id,solicitacao_id,descricao,quantidade,unidade,especificacao,situacao)
    SELECT gen_random_uuid(),s,'[DEMO] Item de validação',10,'un','Registro de demonstração','comprar'
    WHERE NOT EXISTS(SELECT 1 FROM compra_itens WHERE solicitacao_id=s);
    INSERT INTO compra_historico(id,solicitacao_id,usuario_id,acao,situacao_nova,comentario)
    SELECT gen_random_uuid(),s,u,'demo_criada',(SELECT situacao FROM compra_solicitacoes WHERE id=s),'Dado removível de demonstração'
    WHERE NOT EXISTS(SELECT 1 FROM compra_historico WHERE solicitacao_id=s);
  END LOOP;
  SELECT id INTO s FROM compra_solicitacoes WHERE protocolo='SC-'||ano||'-90002';
  INSERT INTO compra_cotacoes(id,solicitacao_id,fornecedor,cnpj,valor_total,frete,desconto,prazo_dias,condicao_pagamento,criada_por)
  SELECT gen_random_uuid(),s,x.nome,x.cnpj,x.valor,x.frete,0,x.prazo,'28 dias',u FROM (VALUES
    ('[DEMO] Fornecedor Alfa','00.000.000/0001-01',950::numeric,0::numeric,7),
    ('[DEMO] Fornecedor Beta','00.000.000/0002-02',900::numeric,25::numeric,5),
    ('[DEMO] Fornecedor Gama','00.000.000/0003-03',980::numeric,0::numeric,3)
  ) x(nome,cnpj,valor,frete,prazo) WHERE NOT EXISTS(SELECT 1 FROM compra_cotacoes WHERE solicitacao_id=s);
  SELECT id INTO s FROM compra_solicitacoes WHERE protocolo='SC-'||ano||'-90003';
  INSERT INTO compra_cotacoes(id,solicitacao_id,fornecedor,valor_total,frete,desconto,prazo_dias,condicao_pagamento,escolhida,criterio_escolha,escolhida_por,escolhida_em,criada_por)
  SELECT gen_random_uuid(),s,'[DEMO] Fornecedor recomendado',1250,0,0,5,'30 dias',true,'Menor preço',u,now(),u
  WHERE NOT EXISTS(SELECT 1 FROM compra_cotacoes WHERE solicitacao_id=s);
  SELECT id INTO s FROM compra_solicitacoes WHERE protocolo='SC-'||ano||'-90004';
  INSERT INTO compra_pedidos(id,solicitacao_id,numero,fornecedor,valor_total,condicao_pagamento,previsao_entrega,criado_por)
  SELECT gen_random_uuid(),s,'PC-'||ano||'-90001','[DEMO] Fornecedor Pedido',2300,'28 dias',current_date+10,u
  WHERE NOT EXISTS(SELECT 1 FROM compra_pedidos WHERE solicitacao_id=s);
  UPDATE compra_solicitacoes SET pedido_numero='PC-'||ano||'-90001',previsao_entrega=current_date+10 WHERE id=s;
END $$;
