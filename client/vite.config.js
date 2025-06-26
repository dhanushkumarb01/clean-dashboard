import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://clean-dashboard.onrender.com', // Use env variable or this for production
    },
  },
}); 