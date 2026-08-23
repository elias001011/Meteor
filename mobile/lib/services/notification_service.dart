import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../core/app_config.dart';

@pragma('vm:entry-point')
Future<void> meteorFirebaseBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // A configured release has a default Firebase app. A local build without
    // google-services.json intentionally remains functional without push.
  }
}

class NotificationService {
  static const generalChannel = AndroidNotificationChannel(
    'meteor_general',
    'Meteor',
    description: 'Atualizações do Meteor',
    importance: Importance.defaultImportance,
  );
  static const severeChannel = AndroidNotificationChannel(
    'meteor_severe',
    'Alertas meteorológicos severos',
    description: 'Alertas oficiais e condições potencialmente perigosas',
    importance: Importance.max,
  );
  static const rainChannel = AndroidNotificationChannel(
    'meteor_rain',
    'Chuva e mudanças rápidas',
    description: 'Avisos de chuva iminente e mudanças do tempo',
    importance: Importance.high,
  );
  static const summaryChannel = AndroidNotificationChannel(
    'meteor_daily',
    'Resumo diário',
    description: 'Previsão resumida no início do dia',
    importance: Importance.defaultImportance,
  );

  final _local = FlutterLocalNotificationsPlugin();
  final _openedRoutes = StreamController<String>.broadcast();
  Future<void>? _initialization;
  String? _pendingRoute;

  Stream<String> get openedRoutes => _openedRoutes.stream;
  bool _ready = false;
  bool get isAvailable => AppConfig.firebaseEnabled && _ready;
  Stream<String> get tokenRefresh =>
      _ready ? FirebaseMessaging.instance.onTokenRefresh : const Stream.empty();

  String? takePendingRoute() {
    final route = _pendingRoute;
    _pendingRoute = null;
    return route;
  }

  Future<void> initialize() => _initialization ??= _initialize();

  Future<void> _initialize() async {
    if (!AppConfig.firebaseEnabled) return;
    try {
      await Firebase.initializeApp();
      await FirebaseAppCheck.instance.activate(
        providerAndroid: AppConfig.firebaseDebugAppCheck
            ? const AndroidDebugProvider()
            : const AndroidPlayIntegrityProvider(),
      );
      FirebaseMessaging.onBackgroundMessage(meteorFirebaseBackgroundHandler);

      const initialization = InitializationSettings(
        android: AndroidInitializationSettings('ic_stat_meteor'),
      );
      await _local.initialize(
        settings: initialization,
        onDidReceiveNotificationResponse: (response) {
          final route = response.payload;
          if (route != null && route.isNotEmpty) _emitRoute(route);
        },
      );
      final android = _local
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();
      for (final channel in [
        generalChannel,
        severeChannel,
        rainChannel,
        summaryChannel,
      ]) {
        await android?.createNotificationChannel(channel);
      }

      FirebaseMessaging.onMessage.listen(_showForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleRemoteOpen);
      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) _handleRemoteOpen(initial);
      _ready = true;
    } catch (error, stackTrace) {
      debugPrint('Meteor push desativado: $error\n$stackTrace');
      _ready = false;
    }
  }

  Future<bool> requestPermission() async {
    if (!_ready) return false;
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  Future<String?> token() async {
    if (!_ready) return null;
    return FirebaseMessaging.instance.getToken();
  }

  Future<PushCredentials?> credentials({bool forceRefresh = false}) async {
    if (!_ready) return null;
    var user = FirebaseAuth.instance.currentUser;
    user ??= (await FirebaseAuth.instance.signInAnonymously()).user;
    if (user == null) return null;
    final values = await Future.wait<String?>([
      user.getIdToken(forceRefresh),
      FirebaseAppCheck.instance.getToken(forceRefresh),
      FirebaseMessaging.instance.getToken(),
    ]);
    if (values.any((value) => value?.isEmpty ?? true)) return null;
    return PushCredentials(
      idToken: values[0]!,
      appCheckToken: values[1]!,
      fcmToken: values[2]!,
    );
  }

  Future<void> revokeToken() async {
    if (!_ready) return;
    await FirebaseMessaging.instance.deleteToken();
  }

  Future<void> _showForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    final channel = _channelFor(message.data['type']?.toString());
    await _local.show(
      id: message.messageId?.hashCode ?? DateTime.now().millisecondsSinceEpoch,
      title: notification.title ?? 'Meteor',
      body: notification.body ?? 'Há uma nova atualização do tempo.',
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          channel.id,
          channel.name,
          channelDescription: channel.description,
          importance: channel.importance,
          priority: channel.importance == Importance.max
              ? Priority.max
              : Priority.high,
        ),
      ),
      payload: _routeFor(message.data),
    );
  }

  void _handleRemoteOpen(RemoteMessage message) {
    _emitRoute(_routeFor(message.data));
  }

  void _emitRoute(String route) {
    if (_openedRoutes.hasListener) {
      _openedRoutes.add(route);
    } else {
      _pendingRoute = route;
    }
  }

  String _routeFor(Map<String, dynamic> data) {
    final route = data['route']?.toString();
    if (const {'today', 'map', 'ai', 'news', 'settings'}.contains(route)) {
      return route!;
    }
    return data['type'] == 'daily' ? 'today' : 'today';
  }

  AndroidNotificationChannel _channelFor(String? type) => switch (type) {
    'severe' => severeChannel,
    'rain' => rainChannel,
    'daily' => summaryChannel,
    _ => generalChannel,
  };

  Future<void> dispose() async {
    await _openedRoutes.close();
  }
}

class PushCredentials {
  const PushCredentials({
    required this.idToken,
    required this.appCheckToken,
    required this.fcmToken,
  });

  final String idToken;
  final String appCheckToken;
  final String fcmToken;
}
