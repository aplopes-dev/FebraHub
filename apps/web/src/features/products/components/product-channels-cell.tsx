"use client";

import EditOutlined from "@mui/icons-material/EditOutlined";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { Button, Popover } from "@/ui";
import type { Product } from "@/features/products/types/product";

type ProductChannelsCellProps = {
  product: Product;
};

export function ProductChannelsCell({ product }: ProductChannelsCellProps) {
  const enabledCount = product.channels.filter((c) => c.enabled).length;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {enabledCount}/{product.channels.length || 2}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 256 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 1, py: 0.5 }}>
            <Button
              type="button"
              variant="text"
              fullWidth
              component={Link}
              href={`/catalogo/produtos/${product.id}`}
              startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
              sx={{ justifyContent: "flex-start" }}
              onClick={() => setAnchorEl(null)}
            >
              Editar disponibilidade
            </Button>
          </Box>
          <List dense sx={{ maxHeight: 224, overflowY: "auto", py: 0.5 }}>
            {product.channels.map((channel) => (
              <ListItem key={channel.id} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={channel.name}
                  secondary={channel.enabled ? "Ativo" : "Inativo"}
                  slotProps={{
                    primary: { variant: "body2" },
                    secondary: { variant: "caption" },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
}
