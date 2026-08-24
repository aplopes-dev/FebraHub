/**
 * Converte a object key do MinIO (coluna `imageUrl`) em flags HTTP.
 * A key **nunca** vai na response — use `GET /v1/products/:id/image` via proxy.
 */
export function toProductImageFlags(imageUrl: string | null): {
  imageUrl: null;
  hasImage: boolean;
} {
  return {
    imageUrl: null,
    hasImage: imageUrl !== null && imageUrl.length > 0,
  };
}
