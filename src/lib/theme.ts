export type Theme = 'light' | 'dark';

export const themeConfig = {
  light: {
    bg: 'bg-white',
    bgSecondary: 'bg-slate-50',
    bgTertiary: 'bg-slate-100',
    text: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textTertiary: 'text-slate-500',
    border: 'border-slate-200',
    borderLight: 'border-slate-100',
    shadow: 'shadow-sm',
    hover: 'hover:bg-slate-100',
    input: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    card: 'bg-white border border-slate-200 shadow-sm',
  },
  dark: {
    bg: 'bg-slate-950',
    bgSecondary: 'bg-slate-900',
    bgTertiary: 'bg-slate-800',
    text: 'text-slate-50',
    textSecondary: 'text-slate-300',
    textTertiary: 'text-slate-400',
    border: 'border-slate-700',
    borderLight: 'border-slate-800',
    shadow: 'shadow-lg shadow-black/50',
    hover: 'hover:bg-slate-800',
    input: 'bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    card: 'bg-slate-900 border border-slate-800 shadow-lg shadow-black/20',
  },
};
