import 'package:flutter_test/flutter_test.dart';
import 'package:meteor/domain/weather_models.dart';
import 'package:meteor/services/insight_engine.dart';

void main() {
  test('prioriza tempestade e calor sobre resumo normal', () {
    final data = _bundle(condition: 'Trovoada', feelsLike: 40);
    final insights = InsightEngine.analyze(data);

    expect(insights.first.severity, InsightSeverity.severe);
    expect(insights.map((item) => item.title), contains('Calor muito intenso'));
  });

  test('produz resumo útil quando não há riscos', () {
    final insights = InsightEngine.analyze(
      _bundle(condition: 'Parcialmente nublado', feelsLike: 22),
    );

    expect(insights, hasLength(1));
    expect(insights.single.severity, InsightSeverity.normal);
    expect(insights.single.body, contains('Hoje varia entre'));
  });
}

WeatherBundle _bundle({required String condition, required double feelsLike}) {
  final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
  return WeatherBundle(
    current: CurrentWeather(
      city: 'São Paulo',
      country: 'BR',
      timestamp: now,
      temperature: feelsLike,
      feelsLike: feelsLike,
      condition: condition,
      icon: '☀️',
      windSpeed: 10,
      humidity: 50,
      pressure: 1012,
      imageUrl: '',
      sunrise: now - 1000,
      sunset: now + 1000,
    ),
    hourly: [
      ForecastItem(
        timestamp: now + 3600,
        temperature: feelsLike,
        icon: '☀️',
        description: condition,
        rainProbability: 0,
      ),
    ],
    daily: [
      ForecastItem(
        timestamp: now,
        temperature: feelsLike + 3,
        minimumTemperature: feelsLike - 3,
        icon: '☀️',
        description: condition,
        rainProbability: 0,
      ),
    ],
    alerts: const [],
    dataSource: 'test',
    fetchedAt: DateTime.now(),
  );
}
