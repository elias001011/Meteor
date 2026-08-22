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
            // Estes arquivos precisam manter URLs estáveis na raiz publicada.
            try {
              for (const asset of ['sw.js', 'manifest.json', 'favicon.svg']) {
                copyFileSync(asset, `dist/${asset}`);
              }
              console.log('✅ Shell PWA copiado para dist/');
            } catch (err) {
              console.error('❌ Erro ao copiar o shell PWA:', err);
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
