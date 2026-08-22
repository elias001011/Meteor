import 'weather_models.dart';

enum MeteorThemeMode { system, light, dark, amoled }

class NotificationPreferences {
  const NotificationPreferences({
    this.severeAlerts = true,
    this.rainSoon = true,
    this.dailySummary = true,
    this.temperature = false,
    this.uv = false,
    this.wind = false,
    this.quietStartHour = 22,
    this.quietEndHour = 7,
  });

  factory NotificationPreferences.fromJson(Json json) =>
      NotificationPreferences(
        severeAlerts: json['severeAlerts'] != false,
        rainSoon: json['rainSoon'] != false,
        dailySummary: json['dailySummary'] != false,
        temperature: json['temperature'] == true,
        uv: json['uv'] == true,
        wind: json['wind'] == true,
        quietStartHour: (json['quietStartHour'] as num?)?.toInt() ?? 22,
        quietEndHour: (json['quietEndHour'] as num?)?.toInt() ?? 7,
      );

  final bool severeAlerts;
  final bool rainSoon;
  final bool dailySummary;
  final bool temperature;
  final bool uv;
  final bool wind;
  final int quietStartHour;
  final int quietEndHour;

  NotificationPreferences copyWith({
    bool? severeAlerts,
    bool? rainSoon,
    bool? dailySummary,
    bool? temperature,
    bool? uv,
    bool? wind,
  }) => NotificationPreferences(
    severeAlerts: severeAlerts ?? this.severeAlerts,
    rainSoon: rainSoon ?? this.rainSoon,
    dailySummary: dailySummary ?? this.dailySummary,
    temperature: temperature ?? this.temperature,
    uv: uv ?? this.uv,
    wind: wind ?? this.wind,
    quietStartHour: quietStartHour,
    quietEndHour: quietEndHour,
  );

  Json toJson() => {
    'severeAlerts': severeAlerts,
    'rainSoon': rainSoon,
    'dailySummary': dailySummary,
    'temperature': temperature,
    'uv': uv,
    'wind': wind,
    'quietStartHour': quietStartHour,
    'quietEndHour': quietEndHour,
  };
}

class AppSettings {
  const AppSettings({
    this.themeMode = MeteorThemeMode.system,
    this.dynamicColor = true,
    this.aiInstructions = '',
    this.pushEnabled = false,
    this.notifications = const NotificationPreferences(),
  });

  factory AppSettings.fromJson(Json json) => AppSettings(
    themeMode: MeteorThemeMode.values.firstWhere(
      (mode) => mode.name == json['themeMode'],
      orElse: () => MeteorThemeMode.system,
    ),
    dynamicColor: json['dynamicColor'] != false,
    aiInstructions: json['aiInstructions']?.toString() ?? '',
    pushEnabled: json['pushEnabled'] == true,
    notifications: json['notifications'] is Map
        ? NotificationPreferences.fromJson(
            Map<String, dynamic>.from(json['notifications'] as Map),
          )
        : const NotificationPreferences(),
  );

  final MeteorThemeMode themeMode;
  final bool dynamicColor;
  final String aiInstructions;
  final bool pushEnabled;
  final NotificationPreferences notifications;

  AppSettings copyWith({
    MeteorThemeMode? themeMode,
    bool? dynamicColor,
    String? aiInstructions,
    bool? pushEnabled,
    NotificationPreferences? notifications,
  }) => AppSettings(
    themeMode: themeMode ?? this.themeMode,
    dynamicColor: dynamicColor ?? this.dynamicColor,
    aiInstructions: aiInstructions ?? this.aiInstructions,
    pushEnabled: pushEnabled ?? this.pushEnabled,
    notifications: notifications ?? this.notifications,
  );

  Json toJson() => {
    'themeMode': themeMode.name,
    'dynamicColor': dynamicColor,
    'aiInstructions': aiInstructions,
    'pushEnabled': pushEnabled,
    'notifications': notifications.toJson(),
  };
}
