#!/usr/bin/env bash
# Backup do FebraHub: dump do Postgres + espelho do bucket do MinIO.
#
# Roda na VPS, por cron. O dump sai comprimido e com a data no nome; o bucket
# vai por espelho incremental. Retenção padrão de 30 dias — o suficiente para
# perceber um erro de carga que só aparece no fechamento do mês.
set -euo pipefail

DIR="${FEBRAHUB_DIR:-/opt/febrahub}"
DESTINO="$DIR/backups"
RETENCAO_DIAS="${RETENCAO_DIAS:-30}"
CARIMBO="$(date +%Y%m%d_%H%M%S)"

cd "$DIR"
set -a; . ./.env; set +a

mkdir -p "$DESTINO/postgres" "$DESTINO/minio"

echo "==> dump do Postgres"
# --clean --if-exists deixa o dump restaurável sobre uma base existente.
docker exec febrahub_postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists --no-owner --no-privileges \
  | gzip -9 > "$DESTINO/postgres/febrahub_${CARIMBO}.sql.gz"

TAMANHO=$(du -h "$DESTINO/postgres/febrahub_${CARIMBO}.sql.gz" | cut -f1)
echo "    febrahub_${CARIMBO}.sql.gz ($TAMANHO)"

# Um dump que não restaura não é backup. O teste é barato: o gzip tem CRC e o
# cabeçalho do pg_dump precisa estar lá.
gzip -t "$DESTINO/postgres/febrahub_${CARIMBO}.sql.gz"
# O head fecha o pipe e o zcat morre de SIGPIPE; com pipefail isso viraria
# "backup corrompido" num arquivo perfeito. Por isso a leitura vai para
# variável, e só o grep decide.
CABECALHO=$(zcat "$DESTINO/postgres/febrahub_${CARIMBO}.sql.gz" 2>/dev/null | head -5) || true
grep -q 'PostgreSQL database dump' <<<"$CABECALHO" \
  || { echo "ERRO: dump sem cabeçalho esperado"; exit 1; }

echo "==> espelho do bucket MinIO"
docker run --rm --network febrahub_interna \
  -v "$DESTINO/minio:/destino" \
  -e MC_HOST_fh="http://${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}@minio:9000" \
  minio/mc:RELEASE.2025-02-21T16-00-46Z \
  mirror --overwrite --remove "fh/${MINIO_BUCKET}" /destino 2>&1 | tail -3 || true

echo "==> limpando backups com mais de ${RETENCAO_DIAS} dias"
find "$DESTINO/postgres" -name '*.sql.gz' -mtime "+${RETENCAO_DIAS}" -print -delete

echo "==> pronto"
du -sh "$DESTINO"/postgres "$DESTINO"/minio
