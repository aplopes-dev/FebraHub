#!/usr/bin/env bash
set -euo pipefail

echo "=== Containers citybox_* ==="
docker ps -a --filter "name=citybox_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Rede citybox-platform ==="
docker network inspect citybox-platform --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "(rede não criada — rode npm run infra:up)"
