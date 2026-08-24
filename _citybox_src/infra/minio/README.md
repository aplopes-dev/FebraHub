# minio — infra

MinIO — object storage **S3-compatível** para mídia catálogo, documentos fiscais e anexos. Portas **9000** / **9001**.

## Papel no monorepo

- **core-api storage:** fotos produto, PDFs.
- **Produção:** CDN na frente (A-06 roadmap).

S3-compatível para mídia de catálogo, documentos fiscais e Realty (operacao.html).

## Subir

```bash
cp .env.example .env
docker compose up -d
```

## Conexão

```
Endpoint: http://localhost:9000
Console:  http://localhost:9001
Access:   MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
```

Buckets criados automaticamente pelo `minio-init`: `citybox-food`, `erp`, `citybox-imoveis`, `citybox-beautiful`.

### `citybox-food` (vertical Food)

Um bucket por vertical. Dentro dele, **cada loja é um prefixo** (`{storeId}/`):

```
citybox-food/
  {storeId}/
    items/
      {itemId}.jpg   # imagens de produtos do cardápio
```

Acesso apenas via food-api (credenciais `MINIO_ACCESS_KEY`); sem URL pública direta.

### `erp` (ERP)

Bucket do `@citybox/erp-api`. Organização → módulo → recurso:

```
erp/
  {organizationId}/
    catalogo/
      products/
        {productId}.jpg   # imagens de produto
```

Acesso apenas via erp-api; o front exibe via proxy
`GET /api/proxy/comercio/v1/products/:id/image` (nunca URL pública do MinIO).

### `citybox-imoveis` (vertical Imóveis)

```
citybox-imoveis/
  {storeId}/
    properties/
      {propertyId}/
        photos/
          {photoId}.jpg
```

Acesso apenas via imoveis-api; download via `GET /api/v1/properties/:id/photos/:photoId`.

O **marketplace-api** cria on-demand o bucket `citybox-platform-users` (fotos de perfil).

### Lifecycle — `citybox-platform-users`

| Política | Recomendação produção |
|----------|----------------------|
| Versioning | Desligado (avatar é sobrescrito por chave fixa `users/{sub}/avatar`) |
| Retenção | Sem expiração automática; limpeza via `DELETE /users/me/photo` |
| Backup | Replicar volume `citybox_minio_data` no backup diário do host |
| Acesso | Apenas core-api (credenciais `MINIO_ACCESS_KEY`); sem URL pública |

Rede interna: `citybox_minio:9000`

## Volumes

- `citybox_minio_data`