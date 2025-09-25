import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/",   // Important for correct asset paths
  server: {
    port: 5173,
    host: true,
    cors: true,
    // This tells Vite to serve index.html for any route not found
    // which is essential for BrowserRouter
    historyApiFallback: true
  }
});