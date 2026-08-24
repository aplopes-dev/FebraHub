import { Box } from '@citybox/mui/atoms';
import { CalendarPageContent } from './calendar-page-content';

/**
 * Agenda: a página (casca) rola; as grades em si não têm scroll interno.
 * ≥1400px: cards na lateral. <1400px: cards iguais lado a lado abaixo da agenda.
 */
export function CalendarPage() {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CalendarPageContent />
    </Box>
  );
}
