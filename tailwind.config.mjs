/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Prata", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        // body: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
      screens: {
        'xss': '320px',
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1320px',
      },
      colors: {
        'sx-teal': '#006b86',
        'sx-orange': '#fd773b',
        'sx-yellow': '#ffcf01',
        'sx-blue': '#1e90ff',
        'sx-purple': '#444aa3',
      },
    },
  },
  plugins: [],
}

