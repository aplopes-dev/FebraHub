"use client";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { formatCurrencyBRL } from "@/features/stock-movements/lib/stock-movement-form-values";
import type { StockMovementLineDetail } from "@/features/stock-movements/types/stock-movement-detail";

type StockMovementDetailLinesTableProps = {
  lines: StockMovementLineDetail[];
  totalCost: number;
};

export function StockMovementDetailLinesTable({
  lines,
  totalCost,
}: StockMovementDetailLinesTableProps) {
  if (lines.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          borderStyle: "dashed",
          px: 2,
          py: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhum produto nesta movimentação.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        overflowX: "auto",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Table sx={{ minWidth: 480 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell>Produto</TableCell>
            <TableCell align="right">Quantidade</TableCell>
            <TableCell align="right">Preço de custo</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.productId}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {line.productName}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {line.productSku}
                </Typography>
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
              >
                {line.quantity}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: "text.secondary",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrencyBRL(line.costPrice)}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 600 }}
              >
                {formatCurrencyBRL(line.subtotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ bgcolor: "action.selected" }}>
            <TableCell colSpan={3} align="right">
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                Total
              </Typography>
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 700 }}
            >
              {formatCurrencyBRL(totalCost)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
