/** Deve bater com `storageKey` do `ThemeProvider` (default do next-themes). */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Script blocking no `<head>` — aplica `.dark` antes do paint.
 * O `ThemeProvider` usa `scriptProps={{ type: 'application/json' }}` para
 * evitar o aviso do React 19; este script substitui o inline do next-themes.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var t=localStorage.getItem(k)||'light';var el=document.documentElement;if(t==='dark'){el.classList.add('dark');}else{el.classList.remove('dark');}}catch(e){}})();`;
