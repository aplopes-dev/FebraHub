import type { ThemeOptions } from '@citybox/mui/theme';

export const THEME_PRESET_IDS = [
  'purple',
  'rose',
  'emerald',
  'sapphire',
  'amber',
  'burgundy',
  'barber',
  'coral',
] as const;

export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export const DEFAULT_THEME_PRESET_ID: ThemePresetId = 'purple';

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  category: string;
  description: string;
  topLoaderColor: string;
  preview: {
    primary: string;
    secondary: string;
    sidebarBgLight: string;
    sidebarBgDark: string;
  };
  light: ThemeOptions;
  dark: ThemeOptions;
};

type PaletteTokens = {
  primary: { main: string; light: string; dark: string };
  background: { default: string; paper: string; header: string };
  sidebar: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
    background: string;
    border: string;
  };
  muted: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  text?: { primary: string; secondary: string };
  divider?: string;
};

function buildModePalette(
  mode: 'light' | 'dark',
  tokens: PaletteTokens,
): ThemeOptions {
  const textPrimary = tokens.text?.primary ?? (mode === 'dark' ? '#F1F5F9' : '#1A1C1E');

  return {
    palette: {
      mode,
      primary: {
        main: tokens.primary.main,
        light: tokens.primary.light,
        dark: tokens.primary.dark,
        contrastText: '#FFFFFF',
      },
      background: tokens.background,
      sidebar: tokens.sidebar,
      muted: tokens.muted,
      ...(tokens.text ? { text: tokens.text } : {}),
      ...(tokens.divider ? { divider: tokens.divider } : {}),
      ...(mode === 'dark'
        ? {
            action: {
              active: textPrimary,
              hover: 'rgba(255, 255, 255, 0.08)',
              selected: 'rgba(255, 255, 255, 0.16)',
              disabled: 'rgba(255, 255, 255, 0.3)',
              disabledBackground: 'rgba(255, 255, 255, 0.12)',
            },
          }
        : {}),
    },
    shape: { borderRadius: 8 },
  };
}

function definePreset(
  preset: Omit<ThemePreset, 'light' | 'dark'> & {
    lightTokens: PaletteTokens;
    darkTokens: PaletteTokens;
  },
): ThemePreset {
  const { lightTokens, darkTokens, ...meta } = preset;
  return {
    ...meta,
    light: buildModePalette('light', lightTokens),
    dark: buildModePalette('dark', darkTokens),
  };
}

export const BEAUTIFUL_THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  purple: definePreset({
    id: 'purple',
    name: 'Roxo Imperial',
    category: 'Salões Premium & Estética',
    description: 'Paleta clássica em tons de púrpura e lilás requintado.',
    topLoaderColor: '#7C3AED',
    preview: {
      primary: '#7C3AED',
      secondary: '#EDE9FE',
      sidebarBgLight: '#F8FAFB',
      sidebarBgDark: '#0F172A',
    },
    lightTokens: {
      primary: { main: '#7C3AED', light: '#F3E8FF', dark: '#5B21B6' },
      background: { default: '#F8FAFC', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#EDE9FE',
        light: '#F5F3FF',
        dark: '#DDD6FE',
        contrastText: '#5B5670',
        background: '#F8FAFB',
        border: '#E4E0F0',
      },
      muted: {
        main: '#F5F5F5',
        light: '#FAFAFA',
        dark: '#E0E0E0',
        contrastText: '#5C6370',
      },
    },
    darkTokens: {
      primary: { main: '#9061F9', light: '#BAA7FF', dark: '#6C2BD9' },
      background: { default: '#0B0F19', paper: '#111827', header: '#111827' },
      sidebar: {
        main: '#1F1735',
        light: '#2D204A',
        dark: '#160F26',
        contrastText: '#E2E8F0',
        background: '#0D111D',
        border: '#1F2937',
      },
      muted: {
        main: '#1F2937',
        light: '#374151',
        dark: '#111827',
        contrastText: '#9CA3AF',
      },
      text: { primary: '#F1F5F9', secondary: '#94A3B8' },
      divider: 'rgba(148, 163, 184, 0.16)',
    },
  }),
  rose: definePreset({
    id: 'rose',
    name: 'Rosa Glamour',
    category: 'Studios Femininos, Lash & Makeup',
    description: 'Rosa vibrante com superfícies em tons rosados.',
    topLoaderColor: '#E11D48',
    preview: {
      primary: '#E11D48',
      secondary: '#FFE4E6',
      sidebarBgLight: '#FFF7F8',
      sidebarBgDark: '#14080C',
    },
    lightTokens: {
      primary: { main: '#E11D48', light: '#FFE4E6', dark: '#9F1239' },
      background: { default: '#FFF7F8', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#FFE4E6',
        light: '#FFF1F2',
        dark: '#FECDD3',
        contrastText: '#6B3A45',
        background: '#FFF7F8',
        border: '#F5D0D6',
      },
      muted: {
        main: '#F8F1F2',
        light: '#FDF7F8',
        dark: '#E8D9DC',
        contrastText: '#6B5560',
      },
    },
    darkTokens: {
      primary: { main: '#FB7185', light: '#FDA4AF', dark: '#E11D48' },
      background: { default: '#14080C', paper: '#1C1014', header: '#1C1014' },
      sidebar: {
        main: '#3A1520',
        light: '#4C1D2B',
        dark: '#2A0F18',
        contrastText: '#FDE2E4',
        background: '#12070A',
        border: '#3F1D28',
      },
      muted: {
        main: '#2A1620',
        light: '#3F2430',
        dark: '#1A1016',
        contrastText: '#F0B6BE',
      },
      text: { primary: '#FDF2F4', secondary: '#E8B4BD' },
      divider: 'rgba(251, 113, 133, 0.18)',
    },
  }),
  emerald: definePreset({
    id: 'emerald',
    name: 'Esmeralda Spa',
    category: 'Spas, Estética Natural & Bem-estar',
    description: 'Verde esmeralda calmante com superfícies menta.',
    topLoaderColor: '#059669',
    preview: {
      primary: '#059669',
      secondary: '#D1FAE5',
      sidebarBgLight: '#F4FAF7',
      sidebarBgDark: '#07140F',
    },
    lightTokens: {
      primary: { main: '#059669', light: '#D1FAE5', dark: '#047857' },
      background: { default: '#F4FAF7', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#D1FAE5',
        light: '#ECFDF5',
        dark: '#A7F3D0',
        contrastText: '#35564A',
        background: '#F4FAF7',
        border: '#CDE8DB',
      },
      muted: {
        main: '#EEF5F1',
        light: '#F7FBFA',
        dark: '#D7E6DE',
        contrastText: '#4C635A',
      },
    },
    darkTokens: {
      primary: { main: '#34D399', light: '#6EE7B7', dark: '#059669' },
      background: { default: '#07140F', paper: '#0E1C16', header: '#0E1C16' },
      sidebar: {
        main: '#123328',
        light: '#164536',
        dark: '#0C241C',
        contrastText: '#D1FAE5',
        background: '#08150F',
        border: '#1A3A2E',
      },
      muted: {
        main: '#163027',
        light: '#214338',
        dark: '#0F1F19',
        contrastText: '#A7F3D0',
      },
      text: { primary: '#ECFDF5', secondary: '#A7F3D0' },
      divider: 'rgba(52, 211, 153, 0.16)',
    },
  }),
  sapphire: definePreset({
    id: 'sapphire',
    name: 'Azul Safira',
    category: 'Clínicas Dermatológicas & Estética Moderna',
    description: 'Azul royal elegante com superfícies translúcidas.',
    topLoaderColor: '#2563EB',
    preview: {
      primary: '#2563EB',
      secondary: '#DBEAFE',
      sidebarBgLight: '#F5F8FD',
      sidebarBgDark: '#0A1224',
    },
    lightTokens: {
      primary: { main: '#2563EB', light: '#DBEAFE', dark: '#1D4ED8' },
      background: { default: '#F5F8FD', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#DBEAFE',
        light: '#EFF6FF',
        dark: '#BFDBFE',
        contrastText: '#3B4C6B',
        background: '#F5F8FD',
        border: '#D5E2F5',
      },
      muted: {
        main: '#EEF2F7',
        light: '#F7FAFD',
        dark: '#D9E2EE',
        contrastText: '#54657A',
      },
    },
    darkTokens: {
      primary: { main: '#60A5FA', light: '#93C5FD', dark: '#2563EB' },
      background: { default: '#0A1224', paper: '#111827', header: '#111827' },
      sidebar: {
        main: '#152445',
        light: '#1D3260',
        dark: '#0E1A33',
        contrastText: '#DBEAFE',
        background: '#0B1428',
        border: '#1E3A5F',
      },
      muted: {
        main: '#1A2740',
        light: '#273552',
        dark: '#111B2E',
        contrastText: '#93C5FD',
      },
      text: { primary: '#EFF6FF', secondary: '#93C5FD' },
      divider: 'rgba(96, 165, 250, 0.16)',
    },
  }),
  amber: definePreset({
    id: 'amber',
    name: 'Dourado Âmbar',
    category: 'Hair Stylists de Luxo & Salões Conceito',
    description: 'Âmbar quente e sofisticado com superfícies douradas.',
    topLoaderColor: '#D97706',
    preview: {
      primary: '#D97706',
      secondary: '#FDE68A',
      sidebarBgLight: '#FDFAF4',
      sidebarBgDark: '#16110A',
    },
    lightTokens: {
      primary: { main: '#D97706', light: '#FEF3C7', dark: '#B45309' },
      background: { default: '#FDFAF4', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#FDE68A',
        light: '#FEF3C7',
        dark: '#FCD34D',
        contrastText: '#6B5424',
        background: '#FDFAF4',
        border: '#F3E4C0',
      },
      muted: {
        main: '#F6F0E6',
        light: '#FBF7F0',
        dark: '#E7DCC8',
        contrastText: '#6B5C43',
      },
    },
    darkTokens: {
      primary: { main: '#FBBF24', light: '#FCD34D', dark: '#D97706' },
      background: { default: '#16110A', paper: '#1F1810', header: '#1F1810' },
      sidebar: {
        main: '#3A2A12',
        light: '#4C3716',
        dark: '#2A1E0C',
        contrastText: '#FEF3C7',
        background: '#14100A',
        border: '#3F2F16',
      },
      muted: {
        main: '#2C2418',
        light: '#3D3222',
        dark: '#1A150E',
        contrastText: '#FDE68A',
      },
      text: { primary: '#FFFBEB', secondary: '#FDE68A' },
      divider: 'rgba(251, 191, 36, 0.16)',
    },
  }),
  burgundy: definePreset({
    id: 'burgundy',
    name: 'Bordeaux Vinho',
    category: 'Visagismo, Maquiagem & Alta Costura',
    description: 'Vinho nobre encorpado com superfícies aveludadas.',
    topLoaderColor: '#881337',
    preview: {
      primary: '#881337',
      secondary: '#FECDD3',
      sidebarBgLight: '#FDF6F7',
      sidebarBgDark: '#16080E',
    },
    lightTokens: {
      primary: { main: '#881337', light: '#FFE4E6', dark: '#4C0519' },
      background: { default: '#FDF6F7', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#FECDD3',
        light: '#FFE4E6',
        dark: '#FDA4AF',
        contrastText: '#6B3342',
        background: '#FDF6F7',
        border: '#EFD0D6',
      },
      muted: {
        main: '#F4EBED',
        light: '#FBF6F7',
        dark: '#E3D4D7',
        contrastText: '#655056',
      },
    },
    darkTokens: {
      primary: { main: '#F43F5E', light: '#FB7185', dark: '#881337' },
      background: { default: '#16080E', paper: '#1F1016', header: '#1F1016' },
      sidebar: {
        main: '#3A1222',
        light: '#4E1830',
        dark: '#280C18',
        contrastText: '#FECDD3',
        background: '#14070C',
        border: '#3F1A28',
      },
      muted: {
        main: '#2C161E',
        light: '#3F222C',
        dark: '#1A0E14',
        contrastText: '#FDA4AF',
      },
      text: { primary: '#FFF1F2', secondary: '#FECDD3' },
      divider: 'rgba(244, 63, 94, 0.18)',
    },
  }),
  barber: definePreset({
    id: 'barber',
    name: 'Grafite Noir',
    category: 'Barbearias Urbanas & Studios Minimalistas',
    description: 'Grafite neutro e sóbrio com superfícies industriais.',
    topLoaderColor: '#334155',
    preview: {
      primary: '#334155',
      secondary: '#E2E8F0',
      sidebarBgLight: '#F8FAFC',
      sidebarBgDark: '#0B1220',
    },
    lightTokens: {
      primary: { main: '#334155', light: '#E2E8F0', dark: '#1E293B' },
      background: { default: '#F8FAFC', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#E2E8F0',
        light: '#F1F5F9',
        dark: '#CBD5E1',
        contrastText: '#475569',
        background: '#F8FAFC',
        border: '#E2E8F0',
      },
      muted: {
        main: '#F1F5F9',
        light: '#F8FAFC',
        dark: '#E2E8F0',
        contrastText: '#64748B',
      },
    },
    darkTokens: {
      primary: { main: '#94A3B8', light: '#CBD5E1', dark: '#64748B' },
      background: { default: '#0B1220', paper: '#111827', header: '#111827' },
      sidebar: {
        main: '#1E293B',
        light: '#334155',
        dark: '#0F172A',
        contrastText: '#E2E8F0',
        background: '#0B1220',
        border: '#1F2937',
      },
      muted: {
        main: '#1F2937',
        light: '#334155',
        dark: '#0F172A',
        contrastText: '#94A3B8',
      },
      text: { primary: '#F1F5F9', secondary: '#94A3B8' },
      divider: 'rgba(148, 163, 184, 0.18)',
    },
  }),
  coral: definePreset({
    id: 'coral',
    name: 'Coral Sunset',
    category: 'Studios Criativos, Bronzeamento & Unhas',
    description: 'Laranja coral enérgico e acolhedor.',
    topLoaderColor: '#EA580C',
    preview: {
      primary: '#EA580C',
      secondary: '#FFEDD5',
      sidebarBgLight: '#FFF8F3',
      sidebarBgDark: '#180E08',
    },
    lightTokens: {
      primary: { main: '#EA580C', light: '#FFEDD5', dark: '#C2410C' },
      background: { default: '#FFF8F3', paper: '#FFFFFF', header: '#FFFFFF' },
      sidebar: {
        main: '#FFEDD5',
        light: '#FFF7ED',
        dark: '#FED7AA',
        contrastText: '#6B4A32',
        background: '#FFF8F3',
        border: '#F3DCC6',
      },
      muted: {
        main: '#F6EEE7',
        light: '#FBF6F1',
        dark: '#E6D5C8',
        contrastText: '#6B5648',
      },
    },
    darkTokens: {
      primary: { main: '#FB923C', light: '#FDBA74', dark: '#EA580C' },
      background: { default: '#180E08', paper: '#21150E', header: '#21150E' },
      sidebar: {
        main: '#3A2214',
        light: '#4C2C18',
        dark: '#2A180E',
        contrastText: '#FFEDD5',
        background: '#160C08',
        border: '#3F2818',
      },
      muted: {
        main: '#2C1C14',
        light: '#3F2A1C',
        dark: '#1A120C',
        contrastText: '#FED7AA',
      },
      text: { primary: '#FFF7ED', secondary: '#FED7AA' },
      divider: 'rgba(251, 146, 60, 0.18)',
    },
  }),
};

export const THEME_PRESET_LIST: ThemePreset[] = THEME_PRESET_IDS.map(
  (id) => BEAUTIFUL_THEME_PRESETS[id],
);

export function isThemePresetId(value: string | null | undefined): value is ThemePresetId {
  return (
    typeof value === 'string' &&
    (THEME_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function resolveThemePreset(themeId: string | null | undefined): ThemePreset {
  if (isThemePresetId(themeId)) {
    return BEAUTIFUL_THEME_PRESETS[themeId];
  }
  return BEAUTIFUL_THEME_PRESETS[DEFAULT_THEME_PRESET_ID];
}
