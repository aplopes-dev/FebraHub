"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@citybox/mui";
import { useQueryClient } from "@tanstack/react-query";
import { useCatalogScope, useOrganization } from "@/lib/organization-context";
import {
  areProductFormValuesEqual,
  createEmptyProductFormValues,
  type ProductCreateFormValues,
} from "@/features/products/types/product-create";
import {
  formValuesToPayload,
  validateProductForm,
} from "@/features/products/lib/product-to-form-values";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/features/products/hooks/use-product-mutations";
import {
  deleteProductImage,
  uploadProductImage,
} from "@/features/products/api/products.service";
import { productKeys } from "@/features/products/hooks/query-keys";
import { ComercioApiError } from "@/lib/api/comercio-client";

function revokeIfBlob(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function imageErrorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

type UseProductFormOptions = {
  initialValues?: ProductCreateFormValues;
  /** Presente = edição; ausente = criação. */
  productId?: string;
};

export function useProductForm(options: UseProductFormOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { scope } = useCatalogScope();
  const { branchId } = useOrganization();
  // Produto novo já nasce na unidade em que o usuário está operando — senão
  // ele salvaria e o item sumiria da lista, que é recortada por unidade.
  const initial =
    options.initialValues ??
    (() => {
      const empty = createEmptyProductFormValues();
      return branchId
        ? { ...empty, selectedUnitIds: [branchId] }
        : empty;
    })();
  const [values, setValues] = useState<ProductCreateFormValues>(initial);
  const [baseline, setBaseline] = useState<ProductCreateFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  /** Arquivo escolhido ainda não enviado ao MinIO. */
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  /** Usuário removeu a imagem existente — DELETE no save. */
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isSyncingImage, setIsSyncingImage] = useState(false);

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    isSyncingImage;

  const isDirty = useMemo(
    () =>
      !areProductFormValuesEqual(values, baseline) ||
      pendingImageFile !== null ||
      imageRemoved,
    [values, baseline, pendingImageFile, imageRemoved],
  );

  const setField = useCallback(
    <K extends keyof ProductCreateFormValues>(
      key: K,
      value: ProductCreateFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setImage = useCallback(
    (next: { previewUrl: string | null; file: File | null }) => {
      setValues((prev) => {
        const prevUrl = prev.imagePreviewUrl;
        if (
          prevUrl &&
          prevUrl !== next.previewUrl &&
          prevUrl !== baseline.imagePreviewUrl
        ) {
          revokeIfBlob(prevUrl);
        }
        return { ...prev, imagePreviewUrl: next.previewUrl };
      });
      setPendingImageFile(next.file);
      // Sem preview e sem arquivo novo = remoção explícita.
      setImageRemoved(next.previewUrl === null && next.file === null);
    },
    [baseline.imagePreviewUrl],
  );

  const discard = useCallback(() => {
    setValues((prev) => {
      if (
        prev.imagePreviewUrl &&
        prev.imagePreviewUrl !== baseline.imagePreviewUrl
      ) {
        revokeIfBlob(prev.imagePreviewUrl);
      }
      return { ...baseline };
    });
    setPendingImageFile(null);
    setImageRemoved(false);
  }, [baseline]);

  const syncImage = useCallback(
    async (productId: string) => {
      if (pendingImageFile) {
        await uploadProductImage(productId, pendingImageFile);
        return;
      }
      if (imageRemoved) {
        await deleteProductImage(productId);
      }
    },
    [pendingImageFile, imageRemoved],
  );

  const save = useCallback(async () => {
    const validationError = validateProductForm(values);
    if (validationError) {
      toast.error("Revise o formulário", { description: validationError });
      return;
    }

    const payload = formValuesToPayload(values);
    const needsImageSync = pendingImageFile !== null || imageRemoved;

    try {
      if (options.productId) {
        await updateMutation.mutateAsync({
          id: options.productId,
          payload,
        });
        if (needsImageSync) {
          setIsSyncingImage(true);
          try {
            await syncImage(options.productId);
            await queryClient.invalidateQueries({
              queryKey: productKeys.all(scope),
            });
          } catch (error) {
            toast.error("Não foi possível sincronizar a imagem", {
              description: imageErrorMessage(error),
            });
          } finally {
            setIsSyncingImage(false);
          }
        }
        setPendingImageFile(null);
        setImageRemoved(false);
        setBaseline({ ...values });
        setHasSavedOnce(true);
        return;
      }

      const product = await createMutation.mutateAsync(payload);
      if (needsImageSync) {
        setIsSyncingImage(true);
        try {
          await syncImage(product.id);
          await queryClient.invalidateQueries({
            queryKey: productKeys.all(scope),
          });
        } catch (error) {
          toast.error("Produto criado, mas a imagem não foi enviada", {
            description: imageErrorMessage(error),
          });
        } finally {
          setIsSyncingImage(false);
        }
      }
      setPendingImageFile(null);
      setImageRemoved(false);
      setBaseline({ ...values });
      setHasSavedOnce(true);
      router.push(`/catalogo/produtos/${product.id}`);
    } catch {
      // Toast de erro do produto já veio da mutation.
    }
  }, [
    values,
    options.productId,
    createMutation,
    updateMutation,
    router,
    pendingImageFile,
    imageRemoved,
    syncImage,
    queryClient,
    scope,
  ]);

  return {
    values,
    setField,
    setImage,
    isDirty,
    hasSavedOnce,
    isSaving,
    discard,
    save,
  };
}
