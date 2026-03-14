export const theme = {
  color: {
    // Mapped from CSS variables — values update automatically with dark mode
    background:         'var(--background)',
    foreground:         'var(--foreground)',
    card:               'var(--card)',
    cardForeground:     'var(--card-foreground)',
    border:             'var(--border)',
    input:              'var(--input)',
    primary:            'var(--primary)',
    primaryForeground:  'var(--primary-foreground)',
    muted:              'var(--muted)',
    mutedForeground:    'var(--muted-foreground)',
    destructive:        'var(--destructive)',
    ring:               'var(--ring)',
    // Static semantic colors
    gray500:  '#6b7280',
    gray600:  '#4b5563',
    gray800:  '#1f2937',
    red500:   '#ef4444',
    blue600:  '#2563eb',
    white:    '#ffffff',
    // Order status color pairs
    status: {
      Pending:        { bg: '#fef9c3', text: '#854d0e' },
      Processing:     { bg: '#dbeafe', text: '#1e3a8a' },
      OutForDelivery: { bg: '#f3e8ff', text: '#581c87' },
      Delivered:      { bg: '#dcfce7', text: '#14532d' },
    } as Record<string, { bg: string; text: string }>,
  },
  radius: {
    sm:   'var(--radius-sm)',
    md:   'var(--radius-md)',
    lg:   'var(--radius-lg)',
    xl:   'var(--radius-xl)',
    full: '9999px',
  },
  space: {
    1:  '0.25rem',
    2:  '0.5rem',
    3:  '0.75rem',
    4:  '1rem',
    5:  '1.25rem',
    6:  '1.5rem',
    8:  '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  font: {
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl': '1.5rem',
  },
  weight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export type Theme = typeof theme;
