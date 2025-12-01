import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5173,
    host: true,
    cors: true,
    historyApiFallback: true,
    // ✅ FIXED: Add exact ngrok domain + wildcard
    allowedHosts: [
      'aeruginous-sharon-accountably.ngrok-free.dev',  // Your exact domain
      '.ngrok-free.app', 
      '.ngrok.io',
      'localhost'
    ],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  }
});
