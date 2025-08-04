import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,        // change this to your desired port if needed
    host: true,        // listens on 0.0.0.0 for LAN access (important for forwarding)
    cors: true         // allow cross-origin requests if needed
  }
});
