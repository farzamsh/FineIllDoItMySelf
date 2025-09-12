import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single default export only
export default defineConfig({
  plugins: [react()],
});