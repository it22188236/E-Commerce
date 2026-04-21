import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
<<<<<<< HEAD
      "/api": {
        target: "http://localhost",
        changeOrigin: true,
      },
=======
      '/api/auth': { target: 'http://localhost:5001', changeOrigin: true },
      '/api/products': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/orders': { target: 'http://localhost:5003', changeOrigin: true },
      '/api/payments': { target: 'http://localhost:5004', changeOrigin: true },
      '/api/notifications': { target: 'http://localhost:5004', changeOrigin: true },
>>>>>>> 21dcfc2 (backup before fixing merge issue)
    },
  },
});
