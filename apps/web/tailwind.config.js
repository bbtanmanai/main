/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'float-medium': 'float 8s ease-in-out infinite',
        'morph-slow': 'morph 15s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%': { transform: 'translateX(-90px)' },
          '100%': { transform: 'translateX(85px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(10px) translateX(-15px)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%' },
          '33%': { borderRadius: '73% 27% 30% 70% / 69% 31% 69% 31%' },
          '66%': { borderRadius: '36% 64% 64% 36% / 64% 48% 52% 26%' },
        },
      },
    },
  },
  plugins: [],
}
