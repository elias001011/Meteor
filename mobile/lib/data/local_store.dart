import 'dart:convert';
import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/app_settings.dart';
import '../domain/content_models.dart';
import '../domain/weather_models.dart';

class LocalStore {
  LocalStore(this._preferences);

  static const _settingsKey = 'meteor.settings.v1';
  static const _locationKey = 'meteor.location.v1';
  static const _weatherKey = 'meteor.weather.v1';
  static const _weatherTimestampKey = 'meteor.weather.timestamp.v1';
  static const _newsKey = 'meteor.news.v1';
  static const _newsTimestampKey = 'meteor.news.timestamp.v1';
  static const _chatKey = 'meteor.chat.v1';
  static const _installationIdKey = 'meteor.push.installation-id.v1';
  static const _pushRegisteredKey = 'meteor.push.registered.v1';

  final SharedPreferences _preferences;

  AppSettings readSettings() {
    final value = _readJson(_settingsKey);
    return value is Map<String, dynamic>
        ? AppSettings.fromJson(value)
        : const AppSettings();
  }

  Future<void> saveSettings(AppSettings settings) =>
      _writeJson(_settingsKey, settings.toJson());

  CityLocation? readLocation() {
    final value = _readJson(_locationKey);
    return value is Map<String, dynamic> ? CityLocation.fromJson(value) : null;
  }

  Future<void> saveLocation(CityLocation location) =>
      _writeJson(_locationKey, location.toJson());

  CachedJson? readWeather() => _readCached(_weatherKey, _weatherTimestampKey);

  Future<void> saveWeather(Json json) =>
      _saveCached(_weatherKey, _weatherTimestampKey, json);

  CachedJson? readNews() => _readCached(_newsKey, _newsTimestampKey);

  Future<void> saveNews(Json json) =>
      _saveCached(_newsKey, _newsTimestampKey, json);

  List<ChatMessage> readChat() {
    final value = _readJson(_chatKey);
    if (value is! List) return const [];
    return value
        .whereType<Map>()
        .map((item) => ChatMessage.fromJson(Map<String, dynamic>.from(item)))
        .take(40)
        .toList();
  }

  Future<void> saveChat(List<ChatMessage> messages) => _writeJson(
    _chatKey,
    messages
        .skip(messages.length > 40 ? messages.length - 40 : 0)
        .map((message) => message.toJson())
        .toList(),
  );

  Future<String> installationId() async {
    final existing = _preferences.getString(_installationIdKey);
    if (existing != null &&
        RegExp(r'^[A-Za-z0-9_-]{16,128}$').hasMatch(existing)) {
      return existing;
    }
    final random = Random.secure();
    final bytes = List<int>.generate(24, (_) => random.nextInt(256));
    final created = base64UrlEncode(bytes).replaceAll('=', '');
    await _preferences.setString(_installationIdKey, created);
    return created;
  }

  bool get pushRegistered => _preferences.getBool(_pushRegisteredKey) == true;

  Future<void> setPushRegistered(bool value) =>
      _preferences.setBool(_pushRegisteredKey, value);

  Future<void> clearOperationalData() async {
    await Future.wait([
      _preferences.remove(_weatherKey),
      _preferences.remove(_weatherTimestampKey),
      _preferences.remove(_newsKey),
      _preferences.remove(_newsTimestampKey),
      _preferences.remove(_chatKey),
    ]);
  }

  Object? _readJson(String key) {
    try {
      final raw = _preferences.getString(key);
      return raw == null ? null : jsonDecode(raw);
    } on FormatException {
      return null;
    }
  }

  Future<void> _writeJson(String key, Object value) =>
      _preferences.setString(key, jsonEncode(value));

  CachedJson? _readCached(String dataKey, String timestampKey) {
    final value = _readJson(dataKey);
    final timestamp = _preferences.getInt(timestampKey);
    if (value is! Map<String, dynamic> || timestamp == null) return null;
    return CachedJson(value, DateTime.fromMillisecondsSinceEpoch(timestamp));
  }

  Future<void> _saveCached(
    String dataKey,
    String timestampKey,
    Json value,
  ) async {
    await Future.wait([
      _writeJson(dataKey, value),
      _preferences.setInt(timestampKey, DateTime.now().millisecondsSinceEpoch),
    ]);
  }
}

class CachedJson {
  const CachedJson(this.data, this.savedAt);

  final Json data;
  final DateTime savedAt;
}
