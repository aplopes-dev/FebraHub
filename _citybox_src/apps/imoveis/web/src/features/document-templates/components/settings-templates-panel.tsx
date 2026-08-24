'use client';

import { useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, IconButton, Input, MenuItem, Select, Stack } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalScrollBody,
  ModalTitle,
} from '@/components/ui/modal';
import { Panel } from '@/components/ui/panel';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { SettingsField } from '@/features/settings/utils/settings-form-styles';
import {
  useCreateDocumentTemplateMutation,
  useDeleteDocumentTemplateMutation,
  useDocumentTemplatesQuery,
  useDocumentVariablesQuery,
  useSeedDefaultTemplatesMutation,
  useUpdateDocumentTemplateMutation,
} from '../hooks/use-document-templates-queries';
import {
  DOCUMENT_TEMPLATE_TYPE_LABEL,
  DOCUMENT_TEMPLATE_TYPES,
  type DocumentTemplate,
  type DocumentTemplateType,
} from '../types';
import {
  TemplateHtmlEditor,
  type TemplateHtmlEditorHandle,
} from './template-html-editor';

type DialogState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; template: DocumentTemplate };

export function SettingsTemplatesPanel() {
  const { data, isPending, isError } = useDocumentTemplatesQuery();
  const variablesQuery = useDocumentVariablesQuery();
  const create = useCreateDocumentTemplateMutation();
  const update = useUpdateDocumentTemplateMutation();
  const remove = useDeleteDocumentTemplateMutation();
  const seed = useSeedDefaultTemplatesMutation();
  const items = data?.data ?? [];
  const pagination = useClientListPagination(items);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [pendingDelete, setPendingDelete] = useState<DocumentTemplate | null>(null);

  if (isError) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os modelos.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <div>
          <p className="text-base font-medium">Modelos de documentos</p>
          <p className="text-sm text-muted-foreground">
            Use tags {'{{lead.nome}}'} no texto. O PDF é gerado na ficha, na agenda
            ou no negócio.
          </p>
        </div>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() =>
              seed.mutate(undefined, {
                onSuccess: (created) =>
                  toast.message(
                    created.length
                      ? `${created.length} esqueleto(s) criados`
                      : 'Esqueletos já existem nesta loja',
                  ),
                onError: () => toast.error('Não foi possível criar os esqueletos'),
              })
            }
          >
            Esqueletos padrão
          </Button>
          <Button startIcon={<AddIcon />} onClick={() => setDialog({ open: true, mode: 'create' })}>
            Novo modelo
          </Button>
        </Stack>
      </Stack>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : pagination.pageItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum modelo nesta loja.</p>
      ) : (
        <Stack spacing={1}>
          {pagination.pageItems.map((template) => (
            <Box
              key={template.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: '16px',
                bgcolor: 'secondary.main',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <p className="truncate text-sm font-medium">{template.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {template.tipoLabel}
                  {template.ativo ? '' : ' · inativo'}
                  {template.isDefault ? ' · padrão' : ''}
                </p>
              </Box>
              <IconButton
                aria-label="Editar"
                onClick={() => setDialog({ open: true, mode: 'edit', template })}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Excluir" onClick={() => setPendingDelete(template)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <ListifyPagination
            count={pagination.total}
            page={pagination.page}
            perPage={pagination.perPage}
            onPageChange={pagination.setPage}
            onPerPageChange={pagination.setPerPage}
            rowsPerPageOptions={pagination.perPageOptions}
          />
        </Stack>
      )}

      {dialog.open ? (
        <TemplateEditorDialog
          template={dialog.mode === 'edit' ? dialog.template : null}
          variables={variablesQuery.data?.variables ?? []}
          saving={create.isPending || update.isPending}
          onClose={() => setDialog({ open: false })}
          onSave={async (payload) => {
            try {
              if (dialog.mode === 'edit') {
                await update.mutateAsync({ id: dialog.template.id, ...payload });
              } else {
                await create.mutateAsync(payload);
              }
              toast.message('Modelo salvo');
              setDialog({ open: false });
            } catch {
              toast.error('Não foi possível salvar o modelo');
            }
          }}
        />
      ) : null}

      <Modal open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <ModalContent>
          <ModalTitle>Excluir modelo?</ModalTitle>
          <ModalDescription>
            {pendingDelete
              ? `O modelo “${pendingDelete.nome}” será removido da loja.`
              : ''}
          </ModalDescription>
          <ModalActions>
            <ModalCancelButton onClick={() => setPendingDelete(null)}>Cancelar</ModalCancelButton>
            <ModalConfirmButton
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await remove.mutateAsync(pendingDelete.id);
                  toast.message('Modelo excluído');
                  setPendingDelete(null);
                } catch {
                  toast.error('Não foi possível excluir');
                }
              }}
            >
              Excluir
            </ModalConfirmButton>
          </ModalActions>
        </ModalContent>
      </Modal>
    </Panel>
  );
}

function TemplateEditorDialog({
  template,
  variables,
  saving,
  onClose,
  onSave,
}: {
  template: DocumentTemplate | null;
  variables: readonly { key: string; label: string; group: string }[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: {
    nome: string;
    tipo: DocumentTemplateType;
    conteudoHtml: string;
    ativo: boolean;
    isDefault: boolean;
  }) => Promise<void>;
}) {
  const editorRef = useRef<TemplateHtmlEditorHandle>(null);
  const [nome, setNome] = useState(template?.nome ?? '');
  const [tipo, setTipo] = useState<DocumentTemplateType>(
    template?.tipo ?? 'outro',
  );
  const [html, setHtml] = useState(template?.conteudoHtml ?? '<p></p>');
  const [ativo, setAtivo] = useState(template?.ativo ?? true);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);

  return (
    <Modal open onClose={onClose}>
      <ModalContent>
        <ModalTitle>{template ? 'Editar modelo' : 'Novo modelo'}</ModalTitle>
        <ModalDescription>
          Insira variáveis pelos botões ao lado. HTML restrito (títulos, listas, negrito).
        </ModalDescription>
        <ModalScrollBody>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <SettingsField label="Nome" htmlFor="tpl-nome">
              <Input
                id="tpl-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                fullWidth
              />
            </SettingsField>
            <SettingsField label="Tipo" htmlFor="tpl-tipo">
              <Select
                id="tpl-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as DocumentTemplateType)}
                fullWidth
              >
                {DOCUMENT_TEMPLATE_TYPES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {DOCUMENT_TEMPLATE_TYPE_LABEL[value]}
                  </MenuItem>
                ))}
              </Select>
            </SettingsField>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 200px' },
              }}
            >
              <TemplateHtmlEditor ref={editorRef} value={html} onChange={setHtml} />
              <Stack spacing={0.75} sx={{ maxHeight: 360, overflow: 'auto' }}>
                <p className="text-xs font-medium text-muted-foreground">Variáveis</p>
                {variables.map((variable) => (
                  <Button
                    key={variable.key}
                    size="small"
                    variant="outlined"
                    onClick={() => editorRef.current?.insertTag(variable.key)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    {variable.label}
                  </Button>
                ))}
              </Stack>
            </Box>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Modelo padrão deste tipo
            </label>
          </Stack>
        </ModalScrollBody>
        <ModalActions>
          <ModalCancelButton onClick={onClose}>Cancelar</ModalCancelButton>
          <ModalConfirmButton
            disabled={!nome.trim() || saving}
            onClick={() =>
              onSave({
                nome: nome.trim(),
                tipo,
                conteudoHtml: html,
                ativo,
                isDefault,
              })
            }
          >
            Salvar
          </ModalConfirmButton>
        </ModalActions>
      </ModalContent>
    </Modal>
  );
}
