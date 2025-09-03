import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/GEN-C_LOGIN/",   // Important for correct asset paths
  server: {
    port: 5173,
    host: true,
    cors: true
  }
});
