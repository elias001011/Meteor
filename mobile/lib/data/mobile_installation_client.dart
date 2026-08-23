import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/app_config.dart';
import '../domain/app_settings.dart';
import '../domain/weather_models.dart';
import '../services/notification_service.dart';

class MobileInstallationClient {
  MobileInstallationClient({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;

  Uri get _endpoint {
    final base = AppConfig.bffUrl.replaceAll(RegExp(r'/+$'), '');
    return Uri.parse('$base/mobile-installation');
  }

  Future<void> upsert({
    required PushCredentials credentials,
    required String installationId,
    required CityLocation location,
    required String timeZone,
    required NotificationPreferences preferences,
    required String appVersion,
    required bool patchFirst,
  }) async {
    final body = <String, Object>{
      'installationId': installationId,
      'fcmToken': credentials.fcmToken,
      'location': {
        'latitude': _roundCoordinate(location.latitude),
        'longitude': _roundCoordinate(location.longitude),
      },
      'timeZone': timeZone,
      'preferences': preferences.toJson(),
      'locale': 'pt-BR',
      'appVersion': appVersion,
    };
    if (patchFirst) {
      try {
        await _send('PATCH', credentials, body);
        return;
      } on PushApiException catch (error) {
        if (error.statusCode != 404) rethrow;
      }
    }
    await _send('POST', credentials, body);
  }

  Future<void> delete({
    required PushCredentials credentials,
    required String installationId,
  }) => _send('DELETE', credentials, {'installationId': installationId});

  Future<void> _send(
    String method,
    PushCredentials credentials,
    Map<String, Object> body,
  ) async {
    try {
      final request = http.Request(method, _endpoint)
        ..headers.addAll({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${credentials.idToken}',
          'X-Firebase-AppCheck': credentials.appCheckToken,
          'X-Meteor-Client': 'android',
        })
        ..body = jsonEncode(body);
      final streamed = await _client
          .send(request)
          .timeout(const Duration(seconds: 20));
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode >= 200 && response.statusCode < 300) return;
      Object? decoded;
      try {
        decoded = jsonDecode(response.body);
      } on FormatException {
        decoded = null;
      }
      final message = decoded is Map ? decoded['message']?.toString() : null;
      throw PushApiException(
        message?.trim().isNotEmpty == true
            ? message!
            : 'Não foi possível salvar as notificações.',
        response.statusCode,
      );
    } on TimeoutException {
      throw const PushApiException(
        'O serviço de notificações demorou para responder.',
      );
    } on http.ClientException {
      throw const PushApiException(
        'Sem conexão com o serviço de notificações.',
      );
    }
  }

  double _roundCoordinate(double value) =>
      double.parse(value.toStringAsFixed(2));
}

class PushApiException implements Exception {
  const PushApiException(this.message, [this.statusCode]);

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}
