'use client';

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Menu, MenuItem, Typography } from '@citybox/mui';
import { setActiveStoreId } from '@/lib/beautiful-api';
import { useStore } from '@/lib/store-context';

export function UnitSwitcher() {
  const queryClient = useQueryClient();
  const { storeId, storeName, stores, setStore, loading } = useStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const canSwitch = stores.length > 1;
  const label = storeName || 'Selecionando unidade…';

  const handleSelect = (id: string, name: string) => {
    setAnchorEl(null);
    if (id === storeId) return;

    // Alinha o header do proxy antes do refetch (evita race com ActiveStoreSync).
    setActiveStoreId(id);
    setStore(id, name);
    void queryClient.invalidateQueries();
  };

  return (
    <>
      <Button
        variant="text"
        color="inherit"
        onClick={(event) => {
          if (!canSwitch) return;
          setAnchorEl(event.currentTarget);
        }}
        startIcon={<StorefrontOutlined sx={{ fontSize: 18 }} />}
        endIcon={
          canSwitch ? <KeyboardArrowDown sx={{ fontSize: 18 }} /> : undefined
        }
        disabled={loading || !storeId}
        aria-haspopup={canSwitch ? 'menu' : undefined}
        aria-expanded={canSwitch ? open : undefined}
        aria-label={
          canSwitch ? 'Trocar unidade ativa' : 'Unidade ativa'
        }
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          px: 1.25,
          minHeight: 36,
          color: 'text.primary',
          cursor: canSwitch ? 'pointer' : 'default',
        }}
      >
        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
          {label}
        </Typography>
      </Button>

      {canSwitch ? (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { minWidth: 220 } } }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 2, py: 1, display: 'block' }}
          >
            Unidade ativa
          </Typography>
          {stores.map((unit) => (
            <MenuItem
              key={unit.id}
              selected={unit.id === storeId}
              onClick={() => handleSelect(unit.id, unit.name)}
            >
              {unit.name}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </>
  );
}
