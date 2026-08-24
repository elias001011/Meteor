# Backend de notificações Android

O push do Meteor é um subsistema server-side. Ele não adiciona inscrição,
permissão, token, segredo ou indicação de push à interface web. O cliente Android
usa Firebase Auth anônimo e Firebase App Check; o servidor usa Firebase Admin,
Firestore, FCM HTTP v1 e OpenWeather One Call 3.0.

## Contrato de instalação

Endpoint: `/.netlify/functions/mobile-installation`

Todos os métodos exigem estes cabeçalhos:

```http
Authorization: Bearer <Firebase ID token anônimo>
X-Firebase-AppCheck: <App Check token>
Content-Type: application/json
```

`POST` registra ou substitui os dados pertencentes à mesma instalação:

```json
{
  "installationId": "<Firebase Installation ID>",
  "fcmToken": "<FCM registration token>",
  "location": { "latitude": -23.55052, "longitude": -46.63331 },
  "timeZone": "America/Sao_Paulo",
  "locale": "pt-BR",
  "appVersion": "1.0.0",
  "preferences": {
    "severeAlerts": true,
    "rainSoon": true,
    "dailySummary": true,
    "temperature": false,
    "uv": false,
    "wind": false,
    "dailySummaryHour": 7,
    "quietHoursEnabled": true,
    "quietStartHour": 22,
    "quietEndHour": 7,
    "coldThresholdC": 5,
    "heatThresholdC": 35,
    "uvThreshold": 8,
    "windThresholdKmh": 60
  }
}
```

`PATCH` exige `installationId` e aceita qualquer subconjunto dos outros campos.
Preferências são mescladas. `DELETE` aceita apenas `installationId` e faz opt-out
idempotente:

```json
{ "installationId": "<Firebase Installation ID>" }
```

Campos desconhecidos, coordenadas fora do planeta, fusos inexistentes, valores
não finitos, thresholds fora dos limites e corpos acima de 16 kB são rejeitados.
O token FCM nunca aparece na resposta. Um hash liga cada token ao UID e à
instalação que o registrou, impedindo que outra sessão anônima tome sua posse.

O endpoint `/.netlify/functions/mobile-push-test` aceita somente `POST`, exige
os mesmos tokens de Auth e App Check e envia uma única mensagem para a
instalação pertencente ao UID autenticado. Ele tem limite próprio de oito
tentativas a cada dez minutos e não permite informar token FCM, título,
conteúdo ou destinatário arbitrário. Serve para diagnosticar a cadeia completa
sem criar um disparador público ou em massa.

## Funcionamento do agendador

`mobile-push-scheduled` roda a cada hora (UTC) como Scheduled Function da
Netlify e não possui URL pública. A cada execução ele:

1. remove instalações sem sincronização há 90 dias;
2. agrupa instalações pela localização aproximada;
3. faz uma consulta One Call 3.0 por grupo, com timeout de 9 segundos;
4. avalia alertas oficiais, chuva nas próximas três horas, temperatura, UV,
   vento e resumo diário no horário escolhido e fuso de cada instalação;
5. reserva uma chave de deduplicação no Firestore antes do envio;
6. envia lotes FCM e remove instalações cujo token foi invalidado.

O silêncio padrão é 22:00–07:00 e pode ser desligado ou alterado pelo usuário.
Apenas um alerta oficial classificado como
crítico pode furar esse período. Chuva e vento têm cooldown de seis horas;
temperatura, UV e resumo usam chaves estáveis por data local. A coleção de
entregas evita duplicidade inclusive se duas execuções se sobrepuserem.

Limites operacionais padrão por execução: 500 instalações, 60 grupos de
localização, concorrência de cinco consultas meteorológicas e no máximo 500
mensagens por lote. Ajustes opcionais:

- `MOBILE_PUSH_MAX_INSTALLATIONS` (máximo aceito pelo código: 10.000);
- `MOBILE_PUSH_MAX_LOCATIONS` (máximo aceito pelo código: 500).

Quando Firebase ou `CLIMA_API` não estão configurados, o agendador encerra sem
consultar dispositivos nem gravar estado parcial. Logs contêm apenas contagens e
nomes/códigos de erro sanitizados — nunca token, UID, coordenada, payload ou
credencial.

## Variáveis e configuração humana

No Netlify, configure para o escopo **Functions/Runtime**, nunca como variável
exposta ao frontend:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: conteúdo JSON integral de uma conta de
  serviço do novo projeto Firebase. Não use base64, arquivo no repositório ou a
  chave antiga;
- `CLIMA_API`: chave server-side do OpenWeather com acesso a One Call 3.0;
- `AWS_LAMBDA_JS_RUNTIME=nodejs22.x`: definido pela UI/CLI/API da Netlify;
- `NODE_VERSION=22`: recomendado para build e execução local equivalentes.

Passos nos consoles:

1. criar um projeto Firebase novo e registrar `com.eliasnunes.meteor`;
2. habilitar Authentication/Anonymous, Firestore e Cloud Messaging API HTTP v1;
3. habilitar App Check com Play Integrity e registrar os SHA-256 de debug/release;
   para APK off-Play, permitir versão não reconhecida pelo catálogo sem remover
   a exigência de integridade do dispositivo;
4. gerar uma conta de serviço exclusiva, com somente os papéis necessários para
   validar Auth/App Check, ler/gravar as três coleções e enviar FCM;
5. adicionar `FIREBASE_SERVICE_ACCOUNT_JSON` como segredo Netlify e redeployar;
6. em Firestore TTL, habilitar expiração no campo `expiresAt` da coleção
   `mobilePushDeliveries`;
7. manter as coleções abaixo inacessíveis ao SDK cliente nas Firestore Rules;
8. testar foreground, background, app encerrado, token rotacionado, opt-out,
   silêncio, 07:00 local e um token revogado em aparelho real.

Coleções privadas usadas pelo Admin SDK:

- `mobilePushInstallations` — token, UID, FID, local aproximado e preferências;
- `mobilePushTokenOwners` — hash do token e caminho de ownership, sem token;
- `mobilePushDeliveries` — chave/status de deduplicação, sem payload nem token.

Uma regra conservadora para essas coleções é `allow read, write: if false;`.
Firebase Admin ignora regras do cliente e continua operando via IAM.

Referências oficiais: [Firebase Admin](https://firebase.google.com/docs/admin/setup),
[FCM server-side](https://firebase.google.com/docs/cloud-messaging/server-environment),
[App Check no backend](https://firebase.google.com/docs/app-check/custom-resource-backend),
[Scheduled Functions da Netlify](https://docs.netlify.com/build/functions/scheduled-functions/).

## Privacidade e retenção

As coordenadas são arredondadas no servidor para duas casas decimais, cerca de
1 km dependendo da latitude. Não são mantidos histórico de localização, cidade,
endereço, texto de mensagem ou conteúdo de IA. O dado mínimo persistido é FID,
token de entrega, UID anônimo, localização aproximada, fuso, versão/locale e
preferências. Cada sincronização renova a retenção por 90 dias; o opt-out apaga a
instalação e o vínculo do token imediatamente. Documentos de deduplicação devem
ser removidos pelo TTL do Firestore.

Antes da distribuição pública, publique uma política de privacidade que explique
essa coleta, sua finalidade, retenção, processadores (Firebase/Google, Netlify e
OpenWeather), opt-out e canal de exclusão. Preencha a seção Data Safety da Play
Store de acordo com a configuração final, não apenas com este documento.
