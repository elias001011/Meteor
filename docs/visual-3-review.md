# Meteor — identidade visual 3.0 e revisão básica

Referências consultadas por SSH em 14/11/2026: `/var/www/connecta-site`,
`/var/www/tec2d`, `/var/www/decs-preview` e `/var/www/imobiliaria`.
A identidade principal vem dos tokens da Connecta: fundo #060607, superfícies
#0c0c0e / #101013, branco quente #f0efec, bordas discretas e títulos editoriais.
Geist é servida localmente na web, com licença em `public/fonts/OFL.txt`.
Publicação limitada à web. Alterações experimentais do Android ficam apenas no worktree local.
“3.0” identifica o visual; versões de pacotes e tags de release são independentes.

## Mudanças

- Web: abertura editorial, ilustração orbital em CSS, hierarquia do painel,
  temperatura ampliada, navegação monocromática, superfícies consistentes nas
  seções e zoom do navegador liberado para acessibilidade.
- Tema claro em branco quente, disponível no cabeçalho e em Ajustes > Aparência,
  persistido no navegador e aplicado antes da primeira pintura. As fotos do clima
  preservam texto branco e sobreposição escura nos dois temas.

## Achados corrigidos

| Achado | Impacto | Correção |
| --- | --- | --- |
| Fontes de chat importadas sem validar estrutura na web | Backup com fonte nula podia quebrar a renderização; links podiam conter credenciais | Sanitização de estrutura, tamanho e URL; validação compartilhada na UI |
| Remoção de localStorage durante iteração por índice | Importação podia preservar metade dos caches antigos | Reutilização de resetCache, que coleta chaves antes de removê-las |
| Coordenadas de backup fora do domínio geográfico | Configuração inválida e erros na consulta | Limites de latitude e longitude na importação/exportação |
| Shell offline permanecia antigo após navegações | HTML antigo podia referenciar assets incompatíveis | Atualização do HTML cacheado após navegação bem-sucedida e cache restrito a assets |
| Dependências npm com 10 alertas (4 altos) | Riscos em ferramentas e dependências transitivas | Atualizações compatíveis no lockfile; npm audit passou a zero alertas |

Um dos avisos do Vite está documentado pelo mantenedor em
https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22.
Não se trata de auditoria completa ou pentest. Credenciais, configurações de
produção de Firebase/Netlify e entrega real de push não foram auditadas.

## Validação

- `npm run check`: typecheck, 21 testes e build de produção.
- `npm audit fix`: zero vulnerabilidades reportadas após atualização.
- Chromium no VPS, servidor temporário em loopback: abertura em 1440px/390px,
  troca claro/escuro/AMOLED, persistência após recarregar, ajustes, menu móvel,
  painel com dados de exemplo, contraste sobre fotos e ausência de overflow/exceções JS.
- A branch Android não faz parte deste commit/publicação.

As branches continuam separadas: `main` para web/BFF, `android` para Flutter.
Nenhum projeto de referência foi alterado; não foi emitida tag de release.
