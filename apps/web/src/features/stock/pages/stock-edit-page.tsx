"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { StockFormView } from "@/features/stock/components/stock-form-view";
import { stockToFormValues } from "@/features/stock/api/stock.mapper";
import { useStockQuery } from "@/features/stock/hooks/use-stock-queries";

type StockEditPageProps = {
  stockId: string;
};

export function StockEditPage({ stockId }: StockEditPageProps) {
  const router = useRouter();
  const { data: stock, isLoading, isError } = useStockQuery(stockId);

  useEffect(() => {
    if (isError) router.replace("/estoque");
  }, [isError, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!stock) return null;

  return (
    <StockFormView
      title={stock.name}
      stockId={stock.id}
      initialValues={stockToFormValues(stock)}
    />
  );
}
