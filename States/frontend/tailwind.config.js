/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#2563EB',
          'primary-dark': '#1d4ed8',
          'primary-light': '#dbeafe',
          sidebar: '#1e2a3a',
          'sidebar-hover': '#263548',
          bg: '#f0f4f8',
          success: '#10b981',
          'success-light': '#d1fae5',
          warning: '#f59e0b',
          'warning-light': '#fef3c7',
          danger: '#ef4444',
          'danger-light': '#fee2e2',
          card: '#ffffff',
          'text-primary': '#1e293b',
          'text-secondary': '#64748b',
          mint: '#6ee7b7',
          'mint-light': '#ecfdf5',
          navy: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        modal: '0 20px 60px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
