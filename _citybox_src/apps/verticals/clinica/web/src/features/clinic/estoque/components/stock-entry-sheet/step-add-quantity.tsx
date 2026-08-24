"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";

import { Input, Label, ScrollArea, Skeleton } from "@citybox/ui/atoms";

import { useStockProducts } from "../../hooks/use-stock-products";
import type { ProductQuantityEntry } from "./types";

interface StepAddQuantityProps {
  entries: ProductQuantityEntry[];
  onEntriesChange: (entries: ProductQuantityEntry[]) => void;
}

export function StepAddQuantity({ entries, onEntriesChange }: StepAddQuantityProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useStockProducts();

  const filteredProducts = useMemo(() => {
    const products = data?.products ?? [];
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data?.products, searchQuery]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const existingIndex = entries.findIndex((e) => e.productId === productId);

    if (quantity === 0) {
      onEntriesChange(entries.filter((e) => e.productId !== productId));
    } else if (existingIndex >= 0) {
      const newEntries = [...entries];
      newEntries[existingIndex] = { productId, quantity };
      onEntriesChange(newEntries);
    } else {
      onEntriesChange([...entries, { productId, quantity }]);
    }
  };

  const getEntryQuantity = (productId: string): number => {
    return entries.find((e) => e.productId === productId)?.quantity ?? 0;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute inset-y-0 start-0 my-auto ms-3 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="ps-9"
        />
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="divide-y">
          {isLoading && (
            <div className="space-y-px">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="size-10 rounded-md" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          )}

          {!isLoading &&
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 overflow-hidden p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                  {product.photoUrl ? (
                    <div className="relative size-10 shrink-0">
                      <Image
                        src={product.photoUrl}
                        alt={product.name}
                        fill
                        className="rounded-md bg-muted object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="size-10 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="flex min-w-0 flex-col overflow-hidden">
                    <span className="block truncate font-medium">{product.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      Qtd. atual: {product.quantity}
                    </span>
                  </div>
                </div>

                <div className="flex w-28 shrink-0 flex-col gap-1.5">
                  <Label className="text-xs">Entrada</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={getEntryQuantity(product.id) || ""}
                    onChange={(event) =>
                      handleQuantityChange(
                        product.id,
                        event.target.value === ""
                          ? 0
                          : Math.trunc(Number(event.target.value) || 0),
                      )
                    }
                  />
                </div>
              </div>
            ))}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
