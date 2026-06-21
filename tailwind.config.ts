import type { Config } from 'tailwindcss'

/**
 * PivotPath Design System — Tailwind Token Config
 *
 * Color naming convention:
 *   navy.*       dark surfaces (backgrounds, cards on dark)
 *   offwhite.*   light surfaces (backgrounds, cards on light)
 *   amber        single CTA/accent color
 *   teal.*       success, direct-transfer states
 *   pp.red       alert/disqualifying state
 *   pp.ink.*     text hierarchy for light backgrounds
 *   pp.text.*    text hierarchy for dark backgrounds
 *   pp.border.*  border tokens
 *   pp.badge.*   confidence badge color triplets (fg/bg/border)
 *   pp.row.*     translation-table row tints + hover states
 *   pp.flag.*    inline flag/alert tints
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Surfaces ────────────────────────────────────────────────────────────
      colors: {
        navy: {
          DEFAULT:  '#0F1923',  // primary dark bg
          surface:  '#16242F',  // dark card / panel surface
          deep:     '#13202B',  // slightly darker (résumé editor left pane)
          deeper:   '#0B121A',  // footer
        },
        offwhite: {
          DEFAULT: '#F2EDE4',   // primary light surface
          surface: '#FBF9F4',   // light card / panel surface
        },
        amber: {
          DEFAULT: '#E8A838',   // sole CTA / accent color
        },
        teal: {
          DEFAULT: '#2E6B6B',   // success / direct-transfer
          light:   '#5FB0A6',   // readiness score, lighter teal text
        },

        // ─── Misc brand ────────────────────────────────────────────────────────
        pp: {
          red: '#C7553B',       // disqualifying / alert

          // Text hierarchy — on dark backgrounds
          'text-bright': '#F2EDE4',
          'text-dim':    '#E4E0D7',
          'text-body':   '#B9C2C9',
          'text-muted':  '#9AA7B0',
          'text-faint':  '#7C8893',
          'text-ghost':  '#5A6470',

          // Text hierarchy — on light backgrounds
          'ink':         '#0F1923',
          'ink-soft':    '#1A2733',
          'ink-body':    '#3B4650',
          'ink-para':    '#4A5560',
          'ink-meta':    '#6A747E',
          'ink-cap':     '#9AA0A0',

          // Borders
          'border-dark':    'rgba(242,237,228,0.12)',
          'border-darker':  'rgba(242,237,228,0.1)',
          'border-light':   'rgba(15,25,35,0.14)',
          'border-lighter': 'rgba(15,25,35,0.1)',
          'border-input':   '#C9C1B2',
          'border-stone':   '#B6AE9E',

          // Confidence badge: High (direct transfer)
          'badge-hi-fg': '#1E5A4E',
          'badge-hi-bg': '#DCEBE5',
          'badge-hi-bd': '#9ECBBE',

          // Confidence badge: Partial
          'badge-pt-fg': '#9A6A14',
          'badge-pt-bg': '#F7E6C4',
          'badge-pt-bd': '#E0BD79',

          // Confidence badge: Needs framing
          'badge-fr-fg': '#5A6470',
          'badge-fr-bg': '#ECE7DC',
          'badge-fr-bd': '#C9C1B2',

          // Translation table row tints
          'row-hi':   '#EAF1EE',
          'row-hi-h': '#E0EBE6',
          'row-pt':   '#FBF1DC',
          'row-pt-h': '#F7E9CB',
          'row-fr':   '#F1EEE6',
          'row-fr-h': '#E9E4D9',

          // Inline flag / alert tints
          'amber-hl':       'rgba(232,168,56,0.16)',
          'amber-hl-open':  'rgba(232,168,56,0.30)',
          'amber-flag-bg':  'rgba(232,168,56,0.12)',
          'amber-flag-bd':  'rgba(232,168,56,0.4)',
          'teal-ok-bg':     'rgba(46,107,107,0.1)',
          'teal-ok-bd':     'rgba(46,107,107,0.4)',
          'teal-ok-faint':  'rgba(46,107,107,0.18)',
          'red-alert-bg':   'rgba(199,85,59,0.08)',
          'red-alert-bd':   'rgba(199,85,59,0.35)',

          // Skill chip highlight states
          'skill-hi-bg': 'rgba(232,168,56,0.22)',
          'skill-hi-bd': 'rgba(232,168,56,0.55)',
          'skill-lo-bg': '#EFEBE2',
          'skill-lo-bd': '#DAD3C6',
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        display: ['var(--font-newsreader)', 'Georgia', '"Times New Roman"', 'serif'],
        body:    ['var(--font-dm-sans)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)',    'ui-monospace', '"Courier New"', 'monospace'],
      },

      // ─── Border Radius ───────────────────────────────────────────────────────
      // The brand uses very tight, near-square radii (2–6px).
      // 'pp' = brand CTA sharp radius
      borderRadius: {
        pp:     '2px',
        'pp-s': '3px',
        'pp-m': '4px',
        'pp-l': '5px',
        'pp-x': '6px',
        'pp-pill': '20px',
        'pp-logo-sm': '8px',
        'pp-logo':    '9px',
        'pp-logo-lg': '10px',
      },

      // ─── Shadows ─────────────────────────────────────────────────────────────
      boxShadow: {
        'pp-amber':  '0 4px 14px -4px rgba(232,168,56,0.6)',
        'pp-card':   '0 30px 70px -30px rgba(0,0,0,0.6)',
        'pp-table':  '0 24px 60px -42px rgba(15,25,35,0.5)',
        'pp-doc':    '0 40px 90px -50px rgba(0,0,0,0.7)',
        'pp-result': '0 28px 70px -38px rgba(0,0,0,0.6)',
        'pp-focus':  '0 0 0 2px rgba(232,168,56,0.55)',
      },

      // ─── Max Widths ───────────────────────────────────────────────────────────
      maxWidth: {
        'pp-narrow':  '720px',
        'pp-content': '1040px',
        'pp-wide':    '1240px',
        'pp-full':    '1320px',
        'pp-doc':     '840px',
      },

      // ─── Keyframes ───────────────────────────────────────────────────────────
      keyframes: {
        ppDash: {
          from: { strokeDashoffset: '60' },
          to:   { strokeDashoffset: '0'  },
        },
        ppPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1'   },
        },
        ppRise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        ppFade: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
      },

      // ─── Animations ──────────────────────────────────────────────────────────
      animation: {
        'pp-dash':       'ppDash 1.1s ease both',
        'pp-dash-delay': 'ppDash 1.1s ease 0.2s both',
        'pp-pulse':      'ppPulse 2s ease-in-out infinite',
        'pp-rise':       'ppRise 0.7s ease both',
        'pp-fade':       'ppFade 0.35s ease both',
      },

      // ─── Backdrop Blur ────────────────────────────────────────────────────────
      // The sticky nav uses backdrop-filter: blur(12px)
      backdropBlur: {
        'pp-nav': '12px',
        'pp-bar': '12px',
      },
    },
  },
  plugins: [],
}

export default config
