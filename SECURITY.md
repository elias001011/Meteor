# Política de segurança

## Versões suportadas

| Linha | Suporte | Escopo |
| --- | --- | --- |
| 6.x | Sim | Web/BFF em `main` e Android em `android` |
| 5.x e anteriores | Não | Legado; não recebe correções |

## Comunicando uma vulnerabilidade

Não abra uma issue pública nem inclua credenciais, tokens, dados pessoais ou
passos de exploração em discussões públicas.

Use o recurso **Report a vulnerability** na aba Security do GitHub. Se ele não
estiver disponível, escreva para **elias.juriatti@outlook.com** com uma descrição
do impacto, versão/commit afetado e uma reprodução mínima. Não envie segredos
reais; use valores revogados ou redigidos.

O recebimento será confirmado assim que possível. A correção e a divulgação
coordenada dependem da gravidade e da capacidade de reproduzir o problema.

## Modelo de segurança

- APIs de terceiros e Firebase Admin são acessados somente no BFF server-side.
- A web não implementa push, e-mail ou SMS e não recebe credenciais desses
  sistemas.
- O Android registra notificações com Firebase Auth anônimo e App Check; tokens
  FCM não aparecem nas respostas nem nos logs.
- Entradas, URLs e corpos têm validação e limites; chamadas externas têm timeout
  e respostas de erro sanitizadas.
- CI executa typecheck, testes, build, auditoria de dependências e CodeQL.
- Credenciais de assinatura Android pertencem a um GitHub Environment protegido
  e jamais ao histórico Git.

Se uma credencial for encontrada, considere-a comprometida: revogue-a primeiro,
substitua consumidores, remova-a do histórico e solicite a purga de refs/caches
ao GitHub quando necessário.
