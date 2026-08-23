import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/app_config.dart';
import '../domain/content_models.dart';
import '../domain/weather_models.dart';

class BffClient {
  BffClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String function, [Map<String, String>? query]) {
    final base = AppConfig.bffUrl.replaceAll(RegExp(r'/+$'), '');
    return Uri.parse('$base/$function').replace(queryParameters: query);
  }

  Future<Json> getJson(String function, Map<String, String> query) async {
    try {
      final response = await _client
          .get(
            _uri(function, query),
            headers: const {
              'Accept': 'application/json',
              'X-Meteor-Client': 'android',
            },
          )
          .timeout(AppConfig.requestTimeout);
      return _decodeResponse(response);
    } on TimeoutException {
      throw const BffException('O servidor demorou para responder.');
    } on http.ClientException {
      throw const BffException('Sem conexão com o servidor Meteor.');
    }
  }

  Future<Json> postJson(String function, Json body) async {
    try {
      final response = await _client
          .post(
            _uri(function),
            headers: const {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Meteor-Client': 'android',
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 40));
      return _decodeResponse(response);
    } on TimeoutException {
      throw const BffException('A IA demorou para responder. Tente novamente.');
    } on http.ClientException {
      throw const BffException('Sem conexão com o servidor Meteor.');
    }
  }

  Json _decodeResponse(http.Response response) {
    Object? decoded;
    try {
      decoded = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      decoded = null;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map ? decoded['message']?.toString() : null;
      throw BffException(
        message?.trim().isNotEmpty == true
            ? message!
            : 'O servidor retornou o erro ${response.statusCode}.',
        statusCode: response.statusCode,
      );
    }
    if (decoded is! Map) {
      throw const BffException('Resposta inválida do servidor.');
    }
    return Map<String, dynamic>.from(decoded);
  }

  Future<List<CityLocation>> searchCities(String query) async {
    final result = await _rawGet('weather', {
      'endpoint': 'direct',
      'q': query,
      'limit': '5',
    });
    if (result is! List) return const [];
    return result
        .whereType<Map>()
        .map((item) => CityLocation.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<Object?> _rawGet(String function, Map<String, String> query) async {
    try {
      final response = await _client
          .get(
            _uri(function, query),
            headers: const {'Accept': 'application/json'},
          )
          .timeout(AppConfig.requestTimeout);
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = decoded is Map ? decoded['message']?.toString() : null;
        throw BffException(message ?? 'Falha ao pesquisar localidade.');
      }
      return decoded;
    } on TimeoutException {
      throw const BffException('A pesquisa demorou para responder.');
    } on FormatException {
      throw const BffException('Resposta inválida do servidor.');
    } on http.ClientException {
      throw const BffException('Sem conexão com o servidor Meteor.');
    }
  }

  Future<Json> fetchWeatherJson(
    CityLocation location, {
    String? imageNonce,
  }) async {
    final params = <String, String>{
      'endpoint': 'all',
      'lat': location.latitude.toString(),
      'lon': location.longitude.toString(),
      'units': 'metric',
    };
    if (location.name.trim().isNotEmpty) params['q'] = location.name;
    if (location.country.trim().isNotEmpty) {
      params['country'] = location.country;
    }
    if (imageNonce?.isNotEmpty == true) params['imageNonce'] = imageNonce!;
    return getJson('weather', params);
  }

  Future<List<NewsArticle>> fetchNews({String? category, String? query}) async {
    final params = <String, String>{'max': '15'};
    if (query?.trim().isNotEmpty == true) {
      params.addAll({'endpoint': 'search', 'q': query!.trim()});
    } else {
      params['endpoint'] = 'top-headlines';
      if (category != null && category != 'general') {
        params['category'] = category;
      }
    }
    final json = await getJson('news', params);
    final articles = json['articles'];
    return articles is List
        ? articles
              .whereType<Map>()
              .map(
                (item) => NewsArticle.fromJson(Map<String, dynamic>.from(item)),
              )
              .toList()
        : const [];
  }

  Future<ChatMessage> sendChat({
    required String prompt,
    required List<ChatMessage> history,
    required WeatherBundle? weather,
    required String userInstructions,
  }) async {
    final json = await postJson('gemini', {
      'prompt': prompt.trim(),
      'history': history
          .skip(history.length > 20 ? history.length - 20 : 0)
          .map((message) => message.toGeminiHistory())
          .toList(),
      'weatherContext': weather?.toContextJson(),
      'timeContext': DateTime.now().toIso8601String(),
      'userInstructions': userInstructions.trim(),
    });
    final text = json['text']?.toString().trim() ?? '';
    if (text.isEmpty) {
      throw const BffException('A IA retornou uma resposta vazia.');
    }
    return ChatMessage(
      role: ChatRole.assistant,
      text: text,
      sentAt: DateTime.now(),
      model: json['model']?.toString(),
      sources: json['sources'] is List
          ? (json['sources'] as List)
                .whereType<Map>()
                .map(
                  (item) =>
                      GroundingSource.fromJson(Map<String, dynamic>.from(item)),
                )
                .where((source) => source.uri.isNotEmpty)
                .take(10)
                .toList()
          : const [],
    );
  }
}

class BffException implements Exception {
  const BffException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}
