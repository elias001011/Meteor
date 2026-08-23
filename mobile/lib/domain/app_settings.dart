import 'weather_models.dart';

enum MeteorThemeMode { system, light, dark, amoled }

enum MeteorAccent {
  indigo,
  blue,
  cyan,
  teal,
  green,
  amber,
  orange,
  rose,
  purple,
}

class NotificationPreferences {
  const NotificationPreferences({
    this.severeAlerts = true,
    this.rainSoon = true,
    this.dailySummary = true,
    this.temperature = false,
    this.uv = false,
    this.wind = false,
    this.dailySummaryHour = 7,
    this.quietHoursEnabled = true,
    this.quietStartHour = 22,
    this.quietEndHour = 7,
    this.coldThresholdC = 5,
    this.heatThresholdC = 35,
    this.uvThreshold = 8,
    this.windThresholdKmh = 60,
  });

  factory NotificationPreferences.fromJson(Json json) =>
      NotificationPreferences(
        severeAlerts: json['severeAlerts'] != false,
        rainSoon: json['rainSoon'] != false,
        dailySummary: json['dailySummary'] != false,
        temperature: json['temperature'] == true,
        uv: json['uv'] == true,
        wind: json['wind'] == true,
        dailySummaryHour: _hour(json['dailySummaryHour'], 7),
        quietHoursEnabled: json['quietHoursEnabled'] != false,
        quietStartHour: (json['quietStartHour'] as num?)?.toInt() ?? 22,
        quietEndHour: (json['quietEndHour'] as num?)?.toInt() ?? 7,
        coldThresholdC: (json['coldThresholdC'] as num?)?.toDouble() ?? 5,
        heatThresholdC: (json['heatThresholdC'] as num?)?.toDouble() ?? 35,
        uvThreshold: (json['uvThreshold'] as num?)?.toDouble() ?? 8,
        windThresholdKmh: (json['windThresholdKmh'] as num?)?.toDouble() ?? 60,
      );

  final bool severeAlerts;
  final bool rainSoon;
  final bool dailySummary;
  final bool temperature;
  final bool uv;
  final bool wind;
  final int dailySummaryHour;
  final bool quietHoursEnabled;
  final int quietStartHour;
  final int quietEndHour;
  final double coldThresholdC;
  final double heatThresholdC;
  final double uvThreshold;
  final double windThresholdKmh;

  NotificationPreferences copyWith({
    bool? severeAlerts,
    bool? rainSoon,
    bool? dailySummary,
    bool? temperature,
    bool? uv,
    bool? wind,
    int? dailySummaryHour,
    bool? quietHoursEnabled,
    int? quietStartHour,
    int? quietEndHour,
    double? coldThresholdC,
    double? heatThresholdC,
    double? uvThreshold,
    double? windThresholdKmh,
  }) => NotificationPreferences(
    severeAlerts: severeAlerts ?? this.severeAlerts,
    rainSoon: rainSoon ?? this.rainSoon,
    dailySummary: dailySummary ?? this.dailySummary,
    temperature: temperature ?? this.temperature,
    uv: uv ?? this.uv,
    wind: wind ?? this.wind,
    dailySummaryHour: dailySummaryHour ?? this.dailySummaryHour,
    quietHoursEnabled: quietHoursEnabled ?? this.quietHoursEnabled,
    quietStartHour: quietStartHour ?? this.quietStartHour,
    quietEndHour: quietEndHour ?? this.quietEndHour,
    coldThresholdC: coldThresholdC ?? this.coldThresholdC,
    heatThresholdC: heatThresholdC ?? this.heatThresholdC,
    uvThreshold: uvThreshold ?? this.uvThreshold,
    windThresholdKmh: windThresholdKmh ?? this.windThresholdKmh,
  );

  Json toJson() => {
    'severeAlerts': severeAlerts,
    'rainSoon': rainSoon,
    'dailySummary': dailySummary,
    'temperature': temperature,
    'uv': uv,
    'wind': wind,
    'dailySummaryHour': dailySummaryHour,
    'quietHoursEnabled': quietHoursEnabled,
    'quietStartHour': quietStartHour,
    'quietEndHour': quietEndHour,
    'coldThresholdC': coldThresholdC,
    'heatThresholdC': heatThresholdC,
    'uvThreshold': uvThreshold,
    'windThresholdKmh': windThresholdKmh,
  };
}

int _hour(Object? value, int fallback) {
  final hour = value is num ? value.toInt() : fallback;
  return hour.clamp(0, 23);
}

class AppSettings {
  const AppSettings({
    this.themeMode = MeteorThemeMode.system,
    this.accent = MeteorAccent.indigo,
    this.darkMap = false,
    this.aiInstructions = '',
    this.pushEnabled = false,
    this.notifications = const NotificationPreferences(),
  });

  factory AppSettings.fromJson(Json json) => AppSettings(
    themeMode: MeteorThemeMode.values.firstWhere(
      (mode) => mode.name == json['themeMode'],
      orElse: () => MeteorThemeMode.system,
    ),
    accent: MeteorAccent.values.firstWhere(
      (accent) => accent.name == json['accent'],
      orElse: () => MeteorAccent.indigo,
    ),
    darkMap: json['darkMap'] == true,
    aiInstructions: json['aiInstructions']?.toString() ?? '',
    pushEnabled: json['pushEnabled'] == true,
    notifications: json['notifications'] is Map
        ? NotificationPreferences.fromJson(
            Map<String, dynamic>.from(json['notifications'] as Map),
          )
        : const NotificationPreferences(),
  );

  final MeteorThemeMode themeMode;
  final MeteorAccent accent;
  final bool darkMap;
  final String aiInstructions;
  final bool pushEnabled;
  final NotificationPreferences notifications;

  AppSettings copyWith({
    MeteorThemeMode? themeMode,
    MeteorAccent? accent,
    bool? darkMap,
    String? aiInstructions,
    bool? pushEnabled,
    NotificationPreferences? notifications,
  }) => AppSettings(
    themeMode: themeMode ?? this.themeMode,
    accent: accent ?? this.accent,
    darkMap: darkMap ?? this.darkMap,
    aiInstructions: aiInstructions ?? this.aiInstructions,
    pushEnabled: pushEnabled ?? this.pushEnabled,
    notifications: notifications ?? this.notifications,
  );

  Json toJson() => {
    'themeMode': themeMode.name,
    'accent': accent.name,
    'darkMap': darkMap,
    'aiInstructions': aiInstructions,
    'pushEnabled': pushEnabled,
    'notifications': notifications.toJson(),
  };
}
