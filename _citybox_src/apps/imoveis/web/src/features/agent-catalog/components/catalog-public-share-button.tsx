'use client';

import ShareIcon from '@mui/icons-material/Share';
import { IconButton } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { copyText } from '@/features/shared/utils/copy-text';
import { catalogHeaderIconButtonSx } from '../utils/catalog-chrome-styles';
import {
  catalogPublicUrl,
  catalogShareWhatsAppMessage,
  shareOrCopyUrl,
} from '../utils/catalog-share';

type CatalogPublicShareButtonProps = {
  agentSlug: string;
  agentName: string;
};

/** Compartilhar catálogo do corretor (header público). */
export function CatalogPublicShareButton({
  agentSlug,
  agentName,
}: CatalogPublicShareButtonProps) {
  async function handleShare() {
    const url = catalogPublicUrl(agentSlug);
    const result = await shareOrCopyUrl({
      title: agentName,
      text: catalogShareWhatsAppMessage(agentSlug),
      url,
      copyText,
    });
    if (result === 'copied') {
      toast.success('Link do catálogo copiado');
    } else if (result === 'failed') {
      toast.error('Não foi possível compartilhar');
    }
  }

  return (
    <IconButton
      type="button"
      aria-label="Compartilhar catálogo"
      onClick={() => void handleShare()}
      sx={catalogHeaderIconButtonSx}
    >
      <ShareIcon sx={{ fontSize: 20 }} aria-hidden />
    </IconButton>
  );
}
