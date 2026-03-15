import type { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme } from './theme';
import { GlobalStyles } from './GlobalStyles';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
}
