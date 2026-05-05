
export default {
  content: [
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/**/*.{js,ts,jsx,tsx,mdx}'
],
  theme: {
    extend: {
      colors: {
        sidebar: '#2C3E50',
        accent: {
          DEFAULT: '#3498DB',
          hover: '#2980B9'
        },
        status: {
          new: '#27AE60',
          transfer: '#F39C12'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
