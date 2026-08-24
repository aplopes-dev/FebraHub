# Contract: Modules API (in-app)

Contrato interno do PDV Flutter — não é HTTP. Consumidores: Home, Counter/Payment app bars, SaleCompleted, atalhos, (futuro) Settings leitura.

Ver [data-model.md](../data-model.md).

## Consulta (obrigatória para UI operacional)

```dart
/// Única API que telas operacionais devem usar para mostrar/esconder
/// controles ligados a módulo.
bool isOperationallyVisible(String moduleId);
```

**Semântica Fase 0**: `true` iff estado do id é `available`.  
`disabled` e `blocked` → `false` (FR-004, FR-017).

## Fonte (injetável)

```dart
abstract class ModuleConfigSource {
  Future<ModuleSetSnapshot> load();
  /// Opcional nesta fase: escrita só via fixture/dev.
  Future<void> save(ModuleSetSnapshot snapshot);
}
```

- Produção futura: implementação remota (ERP) + merge com cache.
- Hoje: `FixtureModuleConfigSource` + `CachedModuleConfigSource` (decorator).

## Mutação (somente desenvolvimento)

```dart
void applyProfile(String profileName); // um dos 4 nomes
void setModuleState(String id, PdvModuleState state); // valida núcleo
```

Em **release**: estes caminhos e o `ModulesPanel` não estão acessíveis (SC-003).

## Validação

```dart
ModuleSetSnapshot ensureValid(ModuleSetSnapshot input);
// core ids → available; nunca retorna snapshot que esconde Balcão/núcleo
```

## Eventos de UI (efeito)

Quando o snapshot muda, todos os `ref.watch` do provider de módulos reconstroem — Home, atalhos e app bars refletem o mesmo conjunto sem segundo store (FR-016).
