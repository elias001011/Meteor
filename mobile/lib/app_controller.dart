import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:geolocator/geolocator.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'data/bff_client.dart';
import 'data/local_store.dart';
import 'data/mobile_installation_client.dart';
import 'data/repositories.dart';
import 'domain/app_settings.dart';
import 'domain/content_models.dart';
import 'domain/weather_models.dart';
import 'services/notification_service.dart';

enum LoadState { idle, loading, success, error }

class AppController extends ChangeNotifier {
  AppController({
    required this.store,
    BffClient? client,
    NotificationService? notifications,
  }) : _client = client ?? BffClient(),
       notifications = notifications ?? NotificationService() {
    weatherRepository = WeatherRepository(_client, store);
    newsRepository = NewsRepository(_client, store);
  }

  final LocalStore store;
  final BffClient _client;
  final NotificationService notifications;
  late final WeatherRepository weatherRepository;
  late final NewsRepository newsRepository;
  final MobileInstallationClient _installationClient =
      MobileInstallationClient();
  StreamSubscription<String>? _tokenRefreshSubscription;

  AppSettings settings = const AppSettings();
  CityLocation location = const CityLocation(
    name: 'São Paulo',
    country: 'BR',
    latitude: -23.5505,
    longitude: -46.6333,
  );
  WeatherBundle? weather;
  List<NewsArticle> news = const [];
  List<ChatMessage> chat = const [];
  LoadState weatherState = LoadState.idle;
  LoadState newsState = LoadState.idle;
  bool isSendingChat = false;
  bool pushBusy = false;
  String? weatherError;
  String? newsError;
  String? chatError;
  String? aiDraft;
  String? pushError;

  Future<void> initialize() async {
    settings = store.readSettings();
    location = store.readLocation() ?? location;
    weather = weatherRepository.readCache();
    chat = store.readChat();
    notifyListeners();
    await notifications.initialize();
    _tokenRefreshSubscription ??= notifications.tokenRefresh.listen((_) {
      if (settings.pushEnabled) unawaited(_syncPush());
    });
    if (settings.pushEnabled) unawaited(_syncPush());
    await Future.wait([refreshWeather(), loadNews()]);
  }

  Future<void> refreshWeather({CityLocation? nextLocation}) async {
    final target = nextLocation ?? location;
    weatherState = LoadState.loading;
    weatherError = null;
    notifyListeners();
    try {
      final result = await weatherRepository.refresh(
        target,
        allowCacheFallback: nextLocation == null,
      );
      weather = result;
      location = CityLocation(
        name: result.current.city,
        country: result.current.country,
        latitude: target.latitude,
        longitude: target.longitude,
      );
      await store.saveLocation(location);
      weatherState = LoadState.success;
      if (settings.pushEnabled) unawaited(_syncPush());
    } catch (error) {
      weatherError = _message(error, 'Não foi possível atualizar o clima.');
      weatherState = LoadState.error;
    }
    notifyListeners();
  }

  Future<List<CityLocation>> searchCities(String value) async {
    final query = value.trim();
    if (query.length < 2) return const [];
    return weatherRepository.search(query);
  }

  Future<void> useCurrentLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw const BffException(
          'Ative a localização do aparelho para continuar.',
        );
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw const BffException(
          'Permissão de localização negada. Você ainda pode pesquisar uma cidade.',
        );
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 15),
        ),
      );
      await refreshWeather(
        nextLocation: CityLocation(
          name: '',
          country: '',
          latitude: position.latitude,
          longitude: position.longitude,
        ),
      );
    } catch (error) {
      weatherError = _message(error, 'Não foi possível obter sua localização.');
      notifyListeners();
    }
  }

  Future<void> loadNews({String? category, String? query}) async {
    newsState = LoadState.loading;
    newsError = null;
    notifyListeners();
    try {
      news = await newsRepository.fetch(category: category, query: query);
      newsState = LoadState.success;
    } catch (error) {
      newsError = _message(error, 'Não foi possível carregar as notícias.');
      newsState = LoadState.error;
    }
    notifyListeners();
  }

  void askAboutNews(NewsArticle article) {
    aiDraft =
        'Analise esta notícia, resuma os fatos e explique o possível impacto:\n\n${article.aiContext}';
    notifyListeners();
  }

  void clearAiDraft() {
    aiDraft = null;
  }

  Future<void> sendMessage(String rawPrompt) async {
    final prompt = rawPrompt.trim();
    if (prompt.isEmpty || isSendingChat) return;
    final userMessage = ChatMessage(
      role: ChatRole.user,
      text: prompt,
      sentAt: DateTime.now(),
    );
    final previousHistory = List<ChatMessage>.from(chat);
    chat = [...chat, userMessage];
    isSendingChat = true;
    chatError = null;
    aiDraft = null;
    notifyListeners();
    try {
      final response = await _client.sendChat(
        prompt: prompt,
        history: previousHistory,
        weather: weather,
        userInstructions: settings.aiInstructions,
      );
      chat = [...chat, response];
      await store.saveChat(chat);
    } catch (error) {
      chatError = _message(error, 'A IA não conseguiu responder agora.');
    }
    isSendingChat = false;
    notifyListeners();
  }

  Future<void> clearChat() async {
    chat = const [];
    await store.saveChat(chat);
    notifyListeners();
  }

  Future<void> updateSettings(AppSettings value) async {
    final notificationChanged =
        settings.notifications.toJson().toString() !=
        value.notifications.toJson().toString();
    settings = value;
    await store.saveSettings(value);
    notifyListeners();
    if (value.pushEnabled && notificationChanged) unawaited(_syncPush());
  }

  Future<bool> enablePush() async {
    pushError = null;
    if (!notifications.isAvailable) {
      pushError = 'Firebase não está configurado nesta instalação do Meteor.';
      notifyListeners();
      return false;
    }
    final allowed = await notifications.requestPermission();
    if (!allowed) {
      pushError = 'Permissão de notificações não concedida.';
      notifyListeners();
      return false;
    }
    settings = settings.copyWith(pushEnabled: true);
    await store.saveSettings(settings);
    notifyListeners();
    return _syncPush();
  }

  Future<void> disablePush() async {
    if (pushBusy) return;
    pushBusy = true;
    pushError = null;
    settings = settings.copyWith(pushEnabled: false);
    await store.saveSettings(settings);
    notifyListeners();
    try {
      final credentials = await notifications.credentials();
      if (credentials != null && store.pushRegistered) {
        await _installationClient.delete(
          credentials: credentials,
          installationId: await store.installationId(),
        );
      }
      await store.setPushRegistered(false);
    } catch (error) {
      // Invalidating the target locally prevents delivery even when the BFF is
      // temporarily unavailable; the server will later remove the dead token.
      pushError = _message(error, 'O servidor não confirmou a remoção.');
    } finally {
      try {
        await notifications.revokeToken();
      } catch (_) {
        // The local opt-out remains saved and is retried on next activation.
      }
      pushBusy = false;
      notifyListeners();
    }
  }

  Future<bool> _syncPush({bool forceAuthRefresh = false}) async {
    if (!settings.pushEnabled || !notifications.isAvailable || pushBusy) {
      return false;
    }
    pushBusy = true;
    pushError = null;
    notifyListeners();
    try {
      final credentials = await notifications.credentials(
        forceRefresh: forceAuthRefresh,
      );
      if (credentials == null) {
        throw const PushApiException(
          'Não foi possível obter as credenciais desta instalação.',
        );
      }
      final timeZone = (await FlutterTimezone.getLocalTimezone()).identifier;
      final package = await PackageInfo.fromPlatform();
      await _installationClient.upsert(
        credentials: credentials,
        installationId: await store.installationId(),
        location: location,
        timeZone: timeZone,
        preferences: settings.notifications,
        appVersion: package.version,
        patchFirst: store.pushRegistered,
      );
      await store.setPushRegistered(true);
      return true;
    } on PushApiException catch (error) {
      if (!forceAuthRefresh &&
          (error.statusCode == 401 || error.statusCode == 403)) {
        pushBusy = false;
        return _syncPush(forceAuthRefresh: true);
      }
      pushError = error.message;
      return false;
    } catch (error) {
      pushError = _message(error, 'Não foi possível ativar as notificações.');
      return false;
    } finally {
      pushBusy = false;
      notifyListeners();
    }
  }

  Future<void> clearLocalData() async {
    await store.clearOperationalData();
    weather = null;
    news = const [];
    chat = const [];
    notifyListeners();
  }

  String _message(Object error, String fallback) {
    if (error is BffException) return error.message;
    final value = error.toString().replaceFirst('Exception: ', '').trim();
    return value.isEmpty ? fallback : value;
  }

  @override
  void dispose() {
    _tokenRefreshSubscription?.cancel();
    unawaited(notifications.dispose());
    super.dispose();
  }
}
