const themeDefinitions = [
  { name: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500', bgHover: 'hover:bg-cyan-400', border: 'border-cyan-500', borderFaded: 'border-cyan-500/30', ring: 'focus:ring-cyan-500', gradient: ['from-cyan-500', 'to-blue-600'], borderTop: 'border-t-cyan-400' },
  { name: 'blue', text: 'text-blue-400', bg: 'bg-blue-600', bgHover: 'hover:bg-blue-500', border: 'border-blue-500', borderFaded: 'border-blue-500/30', ring: 'focus:ring-blue-500', gradient: ['from-blue-600', 'to-indigo-600'], borderTop: 'border-t-blue-400' },
  { name: 'purple', text: 'text-purple-400', bg: 'bg-purple-500', bgHover: 'hover:bg-purple-400', border: 'border-purple-500', borderFaded: 'border-purple-500/30', ring: 'focus:ring-purple-500', gradient: ['from-purple-500', 'to-fuchsia-500'], borderTop: 'border-t-purple-400' },
  { name: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-600', bgHover: 'hover:bg-emerald-500', border: 'border-emerald-500', borderFaded: 'border-emerald-500/30', ring: 'focus:ring-emerald-500', gradient: ['from-emerald-600', 'to-teal-600'], borderTop: 'border-t-emerald-400' },
  { name: 'rose', text: 'text-rose-400', bg: 'bg-rose-600', bgHover: 'hover:bg-rose-500', border: 'border-rose-500', borderFaded: 'border-rose-500/30', ring: 'focus:ring-rose-500', gradient: ['from-rose-600', 'to-pink-600'], borderTop: 'border-t-rose-400' },
  { name: 'amber', text: 'text-amber-400', bg: 'bg-amber-600', bgHover: 'hover:bg-amber-500', border: 'border-amber-500', borderFaded: 'border-amber-500/30', ring: 'focus:ring-amber-500', gradient: ['from-amber-500', 'to-orange-600'], borderTop: 'border-t-amber-400' },
];

const bgOpacities = ['10', '20', '30', '40', '50'];

const safelist = [
  ...themeDefinitions.flatMap((theme) => [
    theme.text,
    theme.bg,
    theme.bgHover,
    theme.border,
    theme.borderFaded,
    theme.ring,
    theme.borderTop,
    ...theme.gradient,
    ...bgOpacities.map((opacity) => `${theme.bg}/${opacity}`),
    ...bgOpacities.map((opacity) => `hover:${theme.bg}/${opacity}`),
    ...bgOpacities.map((opacity) => `group-hover:${theme.bg}/${opacity}`),
    `hover:${theme.bg}`,
  ]),
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './netlify/functions/**/*.{ts,tsx}',
  ],
  safelist,
  theme: {
    extend: {},
  },
  plugins: [],
};
