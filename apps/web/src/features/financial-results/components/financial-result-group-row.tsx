"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";

import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Typography } from "@/ui";
import { formatResultAmount } from "@/features/financial-results/lib/financial-result-format";
import type { ResultGroupBlock } from "@/features/financial-results/types/financial-result";

type FinancialResultGroupRowProps = {
  group: ResultGroupBlock;
  expanded: boolean;
  onToggle: (groupId: string) => void;
};

export function FinancialResultGroupRow({
  group,
  expanded,
  onToggle,
}: FinancialResultGroupRowProps) {
  const amountColor = group.sign === "positive" ? "success.main" : "error.main";

  return (
    <Box>
      <Stack
        component="button"
        type="button"
        direction="row"
        spacing={1.5}
        onClick={() => onToggle(group.groupId)}
        aria-expanded={expanded}
        sx={{
          width: "100%",
          alignItems: "center",
          px: 2,
          py: 1.5,
          textAlign: "left",
          border: 0,
          bgcolor: "background.paper",
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <IconButton
          size="small"
          aria-hidden
          tabIndex={-1}
          sx={{
            pointerEvents: "none",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "text.secondary",
          }}
        >
          <ChevronRight sx={{ fontSize: 16 }} />
        </IconButton>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {group.groupName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {group.accounts.length}{" "}
            {group.accounts.length === 1 ? "conta" : "contas"}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{
            flexShrink: 0,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: amountColor,
          }}
        >
          {formatResultAmount(group.total, group.sign)}
        </Typography>
      </Stack>

      <Collapse in={expanded}>
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {group.accounts.length > 0 ? (
            group.accounts.map((account) => (
              <Box
                component="li"
                key={account.accountId}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 1.25,
                  pr: 2,
                  pl: 6.5,
                  bgcolor: "action.hover",
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {account.accountName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                    color: amountColor,
                  }}
                >
                  {formatResultAmount(account.total, group.sign)}
                </Typography>
              </Box>
            ))
          ) : (
            <Box
              component="li"
              sx={{
                py: 1.25,
                pr: 2,
                pl: 6.5,
                bgcolor: "action.hover",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Nenhuma conta do plano vinculada a este grupo.
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
