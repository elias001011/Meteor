import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'post-build',
          writeBundle() {
            // Copia os arquivos PWA que precisam ficar disponíveis na raiz publicada.
            const pwaAssets = [
              'sw.js',
              'manifest.json',
              'favicon.svg',
              'pwa-icon.svg',
              'pwa-icon-192.png',
              'pwa-icon-512.png',
            ];

            try {
              for (const asset of pwaAssets) {
                copyFileSync(asset, `dist/${asset}`);
              }
              console.log('✅ Arquivos PWA copiados para dist/');
            } catch (err) {
              console.error('❌ Erro ao copiar arquivos PWA:', err);
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
