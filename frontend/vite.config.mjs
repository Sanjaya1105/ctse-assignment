import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '');
  const gatewayBase = (env.VITE_API_GATEWAY_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

  return {
    // Read .env from project root (single shared env file).
    envDir: '..',
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/account': gatewayBase,
        '/shipment': gatewayBase,
        '/tracking': gatewayBase,
        '/notification': gatewayBase,
      },
    },
  };
});
