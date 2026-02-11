import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'copy-sw',
          writeBundle() {
            // Copia o service worker para a pasta dist
            try {
              copyFileSync('sw.js', 'dist/sw.js');
              console.log('Service Worker copiado para dist/');
            } catch (err) {
              console.error('Erro ao copiar sw.js:', err);
            }
          }
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});