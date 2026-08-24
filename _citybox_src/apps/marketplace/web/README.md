# CityBox Web

Versão web do CityBox em React + TypeScript, seguindo o layout de `docs/CityBox-Web.html`. Dados mockados — integração com backend será feita depois.

## Telas

- Home (hero, atalhos, ofertas)
- Busca (filtros, sidebar desktop)
- Produto (PDP)
- Carrinho
- Checkout
- Confirmação
- Minha conta
- Favoritos

## Desenvolvimento local

```bash
cd web
npm install
npm run dev
```

Abra http://localhost:5173

## Docker

**Desenvolvimento** (hot reload):

```bash
cd web
docker compose up web-dev
```

**Produção** (nginx):

```bash
cd web
docker compose up web
```

Abra http://localhost:8080

## Stack

- React 19 + TypeScript
- React Router
- Vite
- **shadcn/ui** (Button, Input, Card, Badge, Sheet, Checkbox, RadioGroup, Label, Separator)
- Tailwind CSS v4
- Fonte Mulish (Google Fonts)
- Docker + Docker Compose

## Estrutura de componentes

```
src/components/
├── ui/              # shadcn/ui
├── layout/          # AppShell, SiteHeader, SiteFooter
├── brand/           # Logo, BrandMark
├── navigation/      # Nav links, carrinho, menu mobile
├── search/          # Busca, filtros, toolbar
├── product/         # ProductCard, galeria, buy panel
├── home/            # Hero, atalhos, ofertas
├── cart/            # Itens, resumo, quantidade
├── account/         # Perfil, menu, confirmação
└── shared/          # PanelCard, EmptyState, layout helpers
```
