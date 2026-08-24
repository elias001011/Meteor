import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:meteor/data/mobile_installation_client.dart';
import 'package:meteor/domain/app_settings.dart';
import 'package:meteor/domain/weather_models.dart';
import 'package:meteor/services/notification_service.dart';

void main() {
  const credentials = PushCredentials(
    idToken: 'firebase-id-token',
    appCheckToken: 'app-check-token',
    fcmToken: 'fcm-token-with-enough-characters-123',
  );
  const location = CityLocation(
    name: 'São Paulo',
    country: 'BR',
    latitude: -23.55052,
    longitude: -46.63331,
  );

  test(
    'registra instalação individual com autenticação e coords arredondadas',
    () async {
      late http.Request captured;
      final client = MobileInstallationClient(
        client: MockClient((request) async {
          captured = request;
          return http.Response('{"installation":{}}', 201);
        }),
      );

      await client.upsert(
        credentials: credentials,
        installationId: 'installation_id_123456',
        location: location,
        timeZone: 'America/Sao_Paulo',
        preferences: const NotificationPreferences(),
        appVersion: '1.0.0',
        patchFirst: false,
      );

      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(captured.method, 'POST');
      expect(captured.headers['authorization'], 'Bearer firebase-id-token');
      expect(captured.headers['x-firebase-appcheck'], 'app-check-token');
      expect(body['location'], {'latitude': -23.55, 'longitude': -46.63});
      expect(body['locale'], 'pt-BR');
    },
  );

  test('PATCH inexistente recua para POST', () async {
    final methods = <String>[];
    final client = MobileInstallationClient(
      client: MockClient((request) async {
        methods.add(request.method);
        return request.method == 'PATCH'
            ? http.Response('{"message":"ausente"}', 404)
            : http.Response('{"installation":{}}', 201);
      }),
    );

    await client.upsert(
      credentials: credentials,
      installationId: 'installation_id_123456',
      location: location,
      timeZone: 'America/Sao_Paulo',
      preferences: const NotificationPreferences(),
      appVersion: '1.0.0',
      patchFirst: true,
    );

    expect(methods, ['PATCH', 'POST']);
  });

  test('DELETE aceita resposta 204 vazia', () async {
    final client = MobileInstallationClient(
      client: MockClient((request) async => http.Response('', 204)),
    );

    await client.delete(
      credentials: credentials,
      installationId: 'installation_id_123456',
    );
  });

  test('teste de push usa endpoint dedicado e mantém autenticação', () async {
    late http.Request captured;
    final client = MobileInstallationClient(
      client: MockClient((request) async {
        captured = request;
        return http.Response('{"ok":true}', 202);
      }),
    );

    await client.sendTest(
      credentials: credentials,
      installationId: 'installation_id_123456',
    );

    expect(captured.method, 'POST');
    expect(captured.url.path, endsWith('/mobile-push-test'));
    expect(captured.headers['authorization'], 'Bearer firebase-id-token');
    expect(captured.headers['x-firebase-appcheck'], 'app-check-token');
    expect(jsonDecode(captured.body), {
      'installationId': 'installation_id_123456',
    });
  });
}
