# Configuração humana do Firebase / FCM

O código do app já contém a integração condicional, os canais Android e os deep
links internos (`today`, `map`, `ai`, `news`, `settings`). Estes passos exigem
acesso humano aos consoles Firebase, Netlify e GitHub.

## 1. Criar um projeto limpo

1. Crie um projeto Firebase dedicado ao Meteor.
2. Registre o app Android com package exato `com.eliasnunes.meteor`.
3. Habilite Cloud Messaging API (HTTP v1).
4. Habilite Firebase Authentication com o provedor **Anônimo**.
5. Registre o app em App Check com Play Integrity e configure a validação no BFF.
6. Adicione os SHA-256 dos keystores de debug e release se App Check exigir.
7. Não reutilize a antiga server key; FCM HTTP v1 usa uma conta de serviço no
   backend e tokens OAuth de curta duração.

`google-services.json` contém configuração pública de cliente, não a credencial
de envio. Mesmo assim, este projeto o ignora para permitir injeção controlada em
CI. Coloque-o temporariamente em:

```text
mobile/android/app/google-services.json
```

## 2. Ativar o plugin Gradle em builds configuradas

O checkout padrão não aplica `com.google.gms.google-services`, porque precisa
continuar compilável sem arquivo Firebase. Na branch/workflow Android:

O plugin `com.google.gms.google-services` já está declarado e é aplicado
automaticamente apenas quando `android/app/google-services.json` existe.
Depois de injetar o arquivo, compile com:

```bash
flutter build appbundle --release \
  --dart-define=METEOR_FIREBASE_ENABLED=true
```

O serviço tenta `Firebase.initializeApp()` e, se o app padrão não existir,
mantém push indisponível sem afetar clima, mapa, notícias ou IA.

## 3. Backend de registro

O cliente chama `mobile-installation` com Firebase Anonymous Auth no header
`Authorization` e App Check no header `X-Firebase-AppCheck`. Ele cria um
identificador aleatório estável por instalação, envia coordenadas arredondadas a
duas casas, fuso IANA, versão e preferências. POST registra, PATCH atualiza e
DELETE remove no opt-out. Um PATCH que encontra registro expirado recua para
POST.

Não há inscrição em tópico público: alertas do usuário são enviados somente ao
token individual registrado. O token não é salvo em SharedPreferences e é
invalidado localmente ao desativar push. Firestore e a conta de serviço existem
somente no backend.

## 4. Payload e canais

Use `data.type` para escolher o canal:

| `type` | canal | uso |
|---|---|---|
| `severe` | `meteor_severe` | alertas oficiais; importância máxima |
| `rain` | `meteor_rain` | chuva iminente; importância alta |
| `daily` | `meteor_daily` | resumo diário; importância padrão |
| outro | `meteor_general` | atualização geral |

Use `data.route` com um destes valores: `today`, `map`, `ai`, `news` ou
`settings`. Rotas desconhecidas abrem Hoje.

Exemplo conceitual (não contém token/segredo):

```json
{
  "notification": {
    "title": "Chuva se aproxima",
    "body": "Alta probabilidade em aproximadamente 40 minutos."
  },
  "data": {
    "type": "rain",
    "route": "today"
  }
}
```

O servidor deve respeitar o silêncio 22:00–07:00 no fuso salvo; apenas alertas
severos oficiais podem furá-lo.

## 5. Permissão e teste

1. Compile um APK configurado e instale em aparelho Android com Google Play
   Services.
2. Em Ajustes, toque em **Ativar**. O app não pede notificação no primeiro uso.
3. Verifique o token em build local sem registrá-lo em logs públicos.
4. Envie uma mensagem de teste e valide primeiro plano, segundo plano, app
   encerrado, cada canal e cada rota.
5. Teste opt-out, rotação de token, modo avião e aparelhos sem Play Services.

## 6. Auth, App Check e Firestore

O APK usa Auth anônimo e App Check com Play Integrity. Para desenvolvimento,
adicione também `--dart-define=METEOR_FIREBASE_DEBUG_APP_CHECK=true`, copie o
token mostrado apenas no log local e registre-o no console; nunca habilite esse
define no release. Firestore não está no APK: todas as leituras/escritas passam
pelo BFF autenticado. Nenhuma conta de serviço ou chave privada pertence ao
cliente.
