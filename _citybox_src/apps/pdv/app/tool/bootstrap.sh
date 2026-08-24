#!/usr/bin/env bash
#
# Gera os runners nativos (android/, linux/, windows/) sem destruir o código
# já escrito.
#
# `flutter create .` num diretório existente SOBRESCREVE os arquivos do template
# — inclusive pubspec.yaml, analysis_options.yaml, README.md, .gitignore e
# lib/main.dart. Este script preserva os nossos, roda o create e restaura.
#
# Uso:  ./tool/bootstrap.sh
#
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v flutter >/dev/null 2>&1; then
  echo "erro: flutter não encontrado no PATH." >&2
  echo "Instale o SDK: https://docs.flutter.dev/get-started/install" >&2
  exit 1
fi

# Arquivos e diretórios que o `flutter create` sobrescreveria.
#
# Os três últimos são runners nativos que FORAM CUSTOMIZADOS (barra de título
# com a marca, nome exibido do app). Sem eles nesta lista, cada bootstrap
# devolveria o nome técnico "citybox_pdv" para as janelas — um bug que só
# aparece semanas depois, quando ninguém lembra do porquê.
PRESERVE=(
  pubspec.yaml
  analysis_options.yaml
  .gitignore
  README.md
  AGENTS.md
  lib
  test
  assets
  linux/runner/my_application.cc
  windows/runner/main.cpp
  android/app/src/main/AndroidManifest.xml
)

BACKUP="$(mktemp -d)"
trap 'rm -rf "$BACKUP"' EXIT

echo "==> Preservando arquivos do projeto em $BACKUP"
for path in "${PRESERVE[@]}"; do
  if [ -e "$path" ]; then
    # `--parents` mantém a hierarquia: sem ele, linux/runner/my_application.cc
    # viraria my_application.cc solto na raiz do backup.
    cp -R --parents "$path" "$BACKUP/"
  fi
done

# O PDV roda em caixa de balcão (desktop) e em aparelho de salão (Android).
# iOS, macOS e web estão fora de escopo — não os adicione sem decisão registrada
# no AGENTS.md, porque cada plataforma extra é superfície de teste permanente.
echo "==> Gerando plataformas com flutter create"
flutter create . \
  --project-name citybox_pdv \
  --org com.citybox \
  --description "PDV Citybox — frente de caixa para desktop e Android" \
  --platforms=android,linux,windows \
  --empty

echo "==> Restaurando arquivos do projeto"
# `lib` e `test` são substituídos por inteiro; o resto é mesclado por cima do
# que o template gerou.
rm -rf lib test
cp -a "$BACKUP/." .

echo "==> flutter pub get"
flutter pub get

echo
echo "Pronto. Rode o app com:"
echo "  flutter run -d linux     # desktop"
echo "  flutter run              # tablet/celular Android conectado"
