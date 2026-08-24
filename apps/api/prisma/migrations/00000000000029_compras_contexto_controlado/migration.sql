CREATE TABLE cadastro_unidades(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),codigo text NOT NULL UNIQUE,nome text NOT NULL,ativa boolean NOT NULL DEFAULT true);
CREATE TABLE cadastro_setores(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text NOT NULL UNIQUE,nome text NOT NULL,ativo boolean NOT NULL DEFAULT true);
CREATE TABLE usuario_unidades(usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,unidade_id uuid NOT NULL REFERENCES cadastro_unidades(id) ON DELETE CASCADE,principal boolean NOT NULL DEFAULT false,PRIMARY KEY(usuario_id,unidade_id));
INSERT INTO cadastro_unidades(codigo,nome) VALUES('SSA','FEBRACIS SSA'),('REC','FEBRACIS REC');
INSERT INTO cadastro_setores(slug,nome) VALUES
 ('geral','Geral'),('comercial','Comercial'),('financeiro','Financeiro'),('marketing','Marketing'),('pedagogico','Pedagógico'),('eventos','Eventos'),('loja','Loja'),('estoque','Estoque'),('crm','CRM');
INSERT INTO usuario_unidades(usuario_id,unidade_id,principal) SELECT u.id,un.id,true FROM usuarios u CROSS JOIN cadastro_unidades un WHERE un.codigo='SSA';
INSERT INTO usuario_unidades(usuario_id,unidade_id,principal) SELECT u.id,un.id,false FROM usuarios u CROSS JOIN cadastro_unidades un WHERE un.codigo='REC' AND u.papel='admin';
ALTER TABLE compra_solicitacoes ADD COLUMN setor_id uuid REFERENCES cadastro_setores(id),ADD COLUMN unidade_id uuid REFERENCES cadastro_unidades(id);
UPDATE compra_solicitacoes s SET setor_id=c.id FROM cadastro_setores c WHERE c.slug=s.setor;
UPDATE compra_solicitacoes s SET unidade_id=u.id FROM cadastro_unidades u WHERE u.codigo='SSA' AND s.unidade_id IS NULL;
