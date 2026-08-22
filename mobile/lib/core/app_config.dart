abstract final class AppConfig {
  static const appName = 'Meteor';

  /// Override in local development with:
  /// --dart-define=METEOR_BFF_URL=http://10.0.2.2:8888/.netlify/functions
  static const bffUrl = String.fromEnvironment(
    'METEOR_BFF_URL',
    defaultValue: 'https://meteor-ai.netlify.app/.netlify/functions',
  );

  /// Firebase is deliberately opt-in so a clean checkout works without
  /// google-services.json. Public Firebase client configuration is added by
  /// flutterfire configure; private server credentials never enter the APK.
  static const firebaseEnabled = bool.fromEnvironment(
    'METEOR_FIREBASE_ENABLED',
    defaultValue: false,
  );

  /// Use only in local Firebase builds after registering the printed App Check
  /// debug token in the Firebase console. Release builds use Play Integrity.
  static const firebaseDebugAppCheck = bool.fromEnvironment(
    'METEOR_FIREBASE_DEBUG_APP_CHECK',
    defaultValue: false,
  );

  static const weatherCacheTtl = Duration(minutes: 50);
  static const newsCacheTtl = Duration(minutes: 10);
  static const requestTimeout = Duration(seconds: 18);
}
