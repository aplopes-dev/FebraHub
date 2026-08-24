import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  InputAdornment,
  Grid,
} from '@mui/material';
import { MultiSelect, type MultiSelectOption } from '@citybox/mui/molecules';
import {
  formatCurrencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from '@/lib/field-masks';
import { PREDEFINED_CATEGORIES } from '../data/mock-catalog';
import type { ServiceItem, ServiceFormData } from '../types/catalog.types';

const CATEGORY_OPTIONS: MultiSelectOption[] = PREDEFINED_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
  serviceToEdit?: ServiceItem | null;
}

export function ServiceFormDialog({
  open,
  onClose,
  onSubmit,
  serviceToEdit,
}: ServiceFormDialogProps) {
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name);
      setCategories(serviceToEdit.categories || []);
      setDurationMinutes(serviceToEdit.durationMinutes);
      setPrice(formatCurrencyInput(serviceToEdit.price));
      setDescription(serviceToEdit.description || '');
      setActive(serviceToEdit.active);
    } else {
      setName('');
      setCategories([]);
      setDurationMinutes(45);
      setPrice('');
      setDescription('');
      setActive(true);
    }
    setErrors({});
  }, [serviceToEdit, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'O nome do serviço é obrigatório.';
    if (categories.length === 0) newErrors.categories = 'Selecione ao menos uma categoria.';
    const priceNum = parseCurrencyInput(price);
    if (priceNum <= 0) newErrors.price = 'Informe um preço maior que zero.';
    if (durationMinutes <= 0) newErrors.durationMinutes = 'Duração deve ser maior que zero.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      categories,
      durationMinutes: Number(durationMinutes),
      price: parseCurrencyInput(price),
      description: description.trim() || undefined,
      active,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {serviceToEdit ? 'Editar Serviço' : 'Novo Serviço'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Nome do Serviço *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corte Masculino & Barba"
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <MultiSelect
                  label="Categorias *"
                  options={CATEGORY_OPTIONS}
                  value={categories}
                  onChange={(newValues) => setCategories(newValues)}
                  placeholder="Selecione as categorias..."
                  errorMessage={errors.categories}
                  fullWidth
                  limitTags={1}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Duração Estimada *"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">min</InputAdornment>,
                    },
                  }}
                  fullWidth
                  error={Boolean(errors.durationMinutes)}
                  helperText={errors.durationMinutes}
                />
              </Grid>
            </Grid>

            <TextField
              label="Preço de Venda (R$) *"
              value={price}
              onChange={(e) => setPrice(maskCurrencyInput(e.target.value))}
              placeholder="0,00"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                },
              }}
              fullWidth
              error={Boolean(errors.price)}
              helperText={errors.price}
            />

            <TextField
              label="Descrição do Serviço"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes dos procedimentos incluídos no serviço..."
              multiline
              rows={3}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  color="primary"
                />
              }
              label="Serviço Ativo para Agendamento"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {serviceToEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
