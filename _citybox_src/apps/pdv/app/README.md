# Citybox PDV

Frente de caixa dos lojistas do ERP Citybox, em Flutter.

Roda em **Linux**, **Windows** e **Android** (tablet e celular). iOS, macOS e web
estão fora de escopo.

> **Estado:** ponto de partida — uma tela em branco com um botão. A interface
> será desenhada do zero.

## Começando

```bash
export PATH="$HOME/development/flutter/bin:$PATH"   # ajuste ao seu SDK

flutter pub get
flutter run -d linux     # desktop
flutter run              # Android conectado
```

## Antes de abrir um PR

```bash
dart format .
flutter analyze          # precisa terminar com "No issues found!"
flutter test
```

## Regenerar os runners nativos

Não rode `flutter create .` direto — ele sobrescreve `pubspec.yaml`,
`analysis_options.yaml`, `lib/main.dart` e os demais arquivos do projeto. Use:

```bash
./tool/bootstrap.sh
```

## Convenções

Estrutura, camadas, regras de estado e contratos de integração estão em
[`AGENTS.md`](AGENTS.md). Leia antes de escrever código.
