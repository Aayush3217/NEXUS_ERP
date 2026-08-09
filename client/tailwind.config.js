/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables theme toggle via HTML class="dark"
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg-color)',
        surface: 'var(--surface-color)',
        border: 'var(--border-color)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        primary: {
          50: 'var(--primary-light)',
          100: 'var(--primary-light-100)',
          200: 'var(--primary-light-200)',
          500: 'var(--primary-color)',
          600: 'var(--primary-hover)',
        },
        success: {
          50: 'var(--success-light)',
          500: 'var(--success-color)',
        },
        warning: {
          50: 'var(--warning-light)',
          500: 'var(--warning-color)',
        },
        danger: {
          50: 'var(--danger-light)',
          500: 'var(--danger-color)',
        },
        info: {
          50: 'var(--info-light)',
          500: 'var(--info-color)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
