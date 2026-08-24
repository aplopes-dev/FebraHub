'use client';

import ShareIcon from '@mui/icons-material/Share';
import { IconButton } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { copyText } from '@/features/shared/utils/copy-text';
import {
  listingPublicUrl,
  listingShareWhatsAppMessage,
  shareOrCopyUrl,
} from '../utils/catalog-share';

type CatalogListingShareButtonProps = {
  agentSlug: string;
  listingId: string;
  listingTitle: string;
  onMedia?: boolean;
};

/**
 * Compartilhar imóvel: Web Share API no mobile; fallback copiar link.
 * Visual flat (ícone) — ok em desktop e mobile.
 */
export function CatalogListingShareButton({
  agentSlug,
  listingId,
  listingTitle,
  onMedia = false,
}: CatalogListingShareButtonProps) {
  async function handleShare() {
    const url = listingPublicUrl(agentSlug, listingId);
    const result = await shareOrCopyUrl({
      title: listingTitle,
      text: listingShareWhatsAppMessage(listingTitle, agentSlug, listingId),
      url,
      copyText,
    });
    if (result === 'copied') {
      toast.success('Link do imóvel copiado');
    } else if (result === 'failed') {
      toast.error('Não foi possível compartilhar');
    }
  }

  return (
    <IconButton
      type="button"
      aria-label="Compartilhar imóvel"
      onClick={() => void handleShare()}
      sx={{
        width: 44,
        height: 44,
        color: onMedia ? 'common.white' : 'text.secondary',
        bgcolor: onMedia ? 'rgba(15, 23, 42, 0.42)' : 'background.paper',
        border: onMedia ? 'none' : '1px solid',
        borderColor: 'divider',
        backdropFilter: onMedia ? 'blur(8px)' : undefined,
        '&:hover': {
          bgcolor: onMedia ? 'rgba(15, 23, 42, 0.58)' : 'action.hover',
          color: onMedia ? 'common.white' : 'text.primary',
        },
      }}
    >
      <ShareIcon sx={{ fontSize: 20 }} aria-hidden />
    </IconButton>
  );
}
