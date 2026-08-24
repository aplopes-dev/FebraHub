-- Usuário somente leitura para Metabase / réplica lógica em dev
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'citybox_readonly') THEN
    CREATE ROLE citybox_readonly WITH LOGIN PASSWORD 'citybox_readonly';
  END IF;
END
$$;
GRANT USAGE ON SCHEMA public TO citybox_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO citybox_readonly;
