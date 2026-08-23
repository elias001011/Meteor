# Meteor para Android

Aplicativo Flutter oficial do Meteor. A interface usa Material 3, português do
Brasil e Android 8.0 (API 26) ou mais recente.

## O que já existe

- Hoje: foto contextual alta, crédito do Unsplash, resumo inteligente separado
  dos alertas, métricas detalhadas, qualidade do ar e gráficos horários/diários.
- Várias localidades com troca por gesto, busca e geolocalização somente em
  primeiro plano.
- Mapa com OpenStreetMap e camadas meteorológicas servidas pelo BFF.
- Chat Gemini com histórico local, contexto da previsão e fontes externas.
- Notícias por categoria/pesquisa com atalho para análise pela IA.
- Tema do sistema, Material You, claro, escuro e AMOLED com preto real.
- Cache local da previsão/notícias, cidade, preferências e conversa.
- Estrutura FCM opcional com canais Android, roteamento ao tocar e preferências.

O app nunca contém chaves de clima, notícias, Gemini, Unsplash ou credenciais de
servidor Firebase. Todas essas chamadas passam pelo BFF Netlify.

## Executar

```bash
flutter pub get
flutter run
```

Por padrão o BFF é:

```text
https://meteor-ai.netlify.app/.netlify/functions
```

Para usar o Netlify Dev no emulador Android:

```bash
flutter run \
  --dart-define=METEOR_BFF_URL=http://10.0.2.2:8888/.netlify/functions
```

Validação antes de cada release:

```bash
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build appbundle --release
```

## Estrutura

```text
lib/
  core/       configuração e tema
  data/       BFF, cache e repositórios
  domain/     modelos sem dependência de interface
  features/   Hoje, Mapa, IA, Notícias, Ajustes e navegação
  services/   insights determinísticos e notificações
```

`AppController` coordena o estado e não conhece detalhes visuais. O cliente BFF
tem URL configurável por `dart-define`, timeout, mensagens de erro seguras e
parsing defensivo. Se a rede falhar, a última previsão salva pode ser exibida.

## Firebase e push

Uma compilação limpa funciona sem `google-services.json`. Firebase só é
inicializado quando `METEOR_FIREBASE_ENABLED=true`; qualquer falha de configuração
desativa push sem impedir o restante do app. Consulte [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
antes de habilitar esse define.

O opt-in cria uma sessão anônima, obtém App Check/FCM e registra a instalação
individualmente no BFF. Não há tópico público por cidade ou preferência.

## Assinatura e release

O projeto não contém keystore nem senha. Builds release falham explicitamente
sem `ANDROID_KEYSTORE_PATH`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS` e
`ANDROID_KEY_PASSWORD` no ambiente (ou propriedades Gradle). Debug continua com
a chave local padrão. O workflow deve injetar esses valores e gerar APK/AAB; nunca os codifique em
Gradle, `dart-define`, repositório ou logs.

## Privacidade

- Localização é solicitada apenas após ação explícita e nunca em segundo plano.
- Preferências e coordenadas não são colocadas em nomes públicos de tópicos FCM.
- Conversas ficam localmente no aparelho, mas cada mensagem enviada à IA inclui
  o histórico recente e um recorte da previsão no BFF.
- Links de notícias/fontes abrem no navegador e passam a obedecer às políticas
  do site externo.
