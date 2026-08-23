import 'package:flutter_test/flutter_test.dart';
import 'package:meteor/domain/app_settings.dart';

void main() {
  test('preferências de notificação persistem horários e limites', () {
    final preferences = NotificationPreferences.fromJson({
      'dailySummaryHour': 9,
      'quietHoursEnabled': false,
      'quietStartHour': 21,
      'quietEndHour': 6,
      'coldThresholdC': 4,
      'heatThresholdC': 34,
      'uvThreshold': 7,
      'windThresholdKmh': 70,
    });

    expect(preferences.dailySummaryHour, 9);
    expect(preferences.quietHoursEnabled, isFalse);
    expect(preferences.quietStartHour, 21);
    expect(preferences.toJson()['windThresholdKmh'], 70);
  });

  test('copyWith realmente altera o período silencioso', () {
    const original = NotificationPreferences();
    final changed = original.copyWith(
      quietStartHour: 20,
      quietEndHour: 8,
      dailySummaryHour: 6,
    );

    expect(changed.quietStartHour, 20);
    expect(changed.quietEndHour, 8);
    expect(changed.dailySummaryHour, 6);
  });
}
