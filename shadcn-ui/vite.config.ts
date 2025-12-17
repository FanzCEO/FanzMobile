import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { viteSourceLocator } from '@metagptx/vite-plugin-source-locator';

// Backend API server - can be overridden with VITE_API_PROXY_TARGET env var
// For Capacitor mobile dev on real devices, set this to your machine's LAN IP
// e.g., VITE_API_PROXY_TARGET=http://192.168.5.240:8000
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: 'mgx',
    }),
    react(),
  ],
  // Enable source maps for debugging - always on for now to debug iOS crash
  build: {
    sourcemap: true,
    minify: false, // Disable minification temporarily for readable stack traces
  },
  server: {
    // Bind to all interfaces so mobile devices can connect
    host: true,
    watch: { usePolling: true, interval: 800 /* 300~1500 */ },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
