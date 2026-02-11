import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { copyFileSync, readFileSync, writeFileSync } from 'fs';

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
          name: 'post-build',
          writeBundle() {
            // Copia o service worker para a pasta dist
            try {
              copyFileSync('sw.js', 'dist/sw.js');
              console.log('✅ Service Worker copiado para dist/');
            } catch (err) {
              console.error('❌ Erro ao copiar sw.js:', err);
            }
            
            // Substitui variáveis de ambiente no index.html
            try {
              const indexPath = 'dist/index.html';
              let html = readFileSync(indexPath, 'utf-8');
              
              // Substitui ${VAPID_PUBLIC_KEY} pelo valor da variável de ambiente
              const vapidKey = process.env.VAPID_PUBLIC_KEY || '';
              html = html.replace(/\$\{VAPID_PUBLIC_KEY\}/g, vapidKey);
              
              writeFileSync(indexPath, html);
              console.log('✅ Variáveis de ambiente substituídas no index.html');
            } catch (err) {
              console.error('❌ Erro ao substituir variáveis:', err);
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