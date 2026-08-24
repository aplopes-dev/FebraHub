#!/usr/bin/env bash
# DEPRECATED — use: pnpm run deploy:prod  (scripts/deploy/aplopes-production.sh)
exec bash "$(cd "$(dirname "$0")/../../.." && pwd)/scripts/deploy/aplopes-production.sh" "$@"
