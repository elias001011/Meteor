import '../domain/weather_models.dart';

enum InsightSeverity { normal, attention, warning, severe }

class WeatherInsight {
  const WeatherInsight({
    required this.title,
    required this.body,
    required this.severity,
  });

  final String title;
  final String body;
  final InsightSeverity severity;
}

abstract final class InsightEngine {
  static List<WeatherInsight> analyze(WeatherBundle data) {
    final result = <WeatherInsight>[];
    final current = data.current;
    final condition = current.condition.toLowerCase();
    final nextHours = data.hourly.take(6).toList();

    final overview = WeatherInsight(
      title: '${current.condition} em ${current.city}',
      body: _overview(data),
      severity: InsightSeverity.normal,
    );

    if (_contains(condition, ['tempest', 'trovo', 'thunder', 'granizo'])) {
      result.add(
        WeatherInsight(
          title: 'Tempestade na região',
          body: 'Evite áreas abertas e acompanhe os alertas oficiais locais.',
          severity: InsightSeverity.severe,
        ),
      );
    }

    final rainPeak = nextHours.isEmpty
        ? null
        : nextHours.reduce(
            (a, b) => a.rainProbability >= b.rainProbability ? a : b,
          );
    final rainSoon = (rainPeak?.rainProbability ?? 0) >= .6;
    if (current.rainLastHour != null && current.rainLastHour! >= 5) {
      result.add(
        WeatherInsight(
          title: 'Chuva intensa agora',
          body:
              'Foram registrados ${current.rainLastHour!.toStringAsFixed(1)} mm na última hora. Redobre a atenção em deslocamentos e não atravesse áreas alagadas.',
          severity: InsightSeverity.warning,
        ),
      );
    } else if (rainSoon && !_contains(condition, ['chuv', 'garoa', 'rain'])) {
      result.add(
        WeatherInsight(
          title: 'Chuva provável nas próximas horas',
          body:
              'Pico de ${(rainPeak!.rainProbability * 100).round()}% por volta de ${_hour(rainPeak.timestamp)}. Leve proteção e antecipe atividades ao ar livre.',
          severity: InsightSeverity.attention,
        ),
      );
    }

    if (current.feelsLike >= 38) {
      result.add(
        WeatherInsight(
          title: 'Calor muito intenso',
          body:
              'Sensação de ${current.feelsLike.round()} °C. Hidrate-se e reduza a exposição prolongada ao sol.',
          severity: InsightSeverity.warning,
        ),
      );
    } else if (current.feelsLike <= 3) {
      result.add(
        WeatherInsight(
          title: 'Frio intenso',
          body:
              'Sensação de ${current.feelsLike.round()} °C. Use proteção adequada ao sair.',
          severity: InsightSeverity.warning,
        ),
      );
    }

    final dailyUv = data.daily.isEmpty ? null : data.daily.first.uvIndex;
    final relevantUv = current.uvIndex ?? dailyUv ?? 0;
    if (relevantUv >= 8) {
      result.add(
        WeatherInsight(
          title: 'Índice UV muito alto',
          body:
              'Índice previsto em ${relevantUv.toStringAsFixed(1)}. Prefira sombra, protetor solar e evite exposição prolongada perto do meio-dia.',
          severity: InsightSeverity.warning,
        ),
      );
    }
    if (current.windSpeed >= 60 || (current.windGust ?? 0) >= 75) {
      result.add(
        const WeatherInsight(
          title: 'Vento forte',
          body: 'Cuidado com objetos soltos, árvores e estruturas vulneráveis.',
          severity: InsightSeverity.warning,
        ),
      );
    }
    if ((current.visibility ?? double.infinity) < 1000) {
      result.add(
        const WeatherInsight(
          title: 'Visibilidade muito baixa',
          body: 'Reduza a velocidade e aumente a distância em deslocamentos.',
          severity: InsightSeverity.warning,
        ),
      );
    }
    final aqi = data.airQuality?.index;
    final pm25 = data.airQuality?.pm25;
    if ((aqi != null && aqi >= 4) || (pm25 != null && pm25 >= 35)) {
      result.add(
        const WeatherInsight(
          title: 'Qualidade do ar ruim',
          body: 'Pessoas sensíveis devem considerar reduzir esforço intenso ao ar livre.',
          severity: InsightSeverity.attention,
        ),
      );
    }

    result.sort((a, b) => b.severity.index.compareTo(a.severity.index));
    return [overview, ...result.take(2)];
  }

  static String _overview(WeatherBundle data) {
    final current = data.current;
    final daily = data.daily.isEmpty ? null : data.daily.first;
    final nextHours = data.hourly.take(6).toList();
    final rainPeak = nextHours.fold<double>(
      0,
      (value, item) =>
          item.rainProbability > value ? item.rainProbability : value,
    );
    final rainText = rainPeak >= .3
        ? ' chance de chuva de até ${(rainPeak * 100).round()}% nas próximas 6 h.'
        : ' baixa chance de chuva nas próximas 6 h.';
    if (daily != null && daily.minimumTemperature != null) {
      return 'Agora ${current.temperature.round()} °C, sensação de ${current.feelsLike.round()} °C. Hoje: ${daily.minimumTemperature!.round()}–${daily.temperature.round()} °C e$rainText';
    }
    return 'Agora ${current.temperature.round()} °C, sensação de ${current.feelsLike.round()} °C e$rainText';
  }

  static String _hour(int timestamp) {
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
    return '${date.hour.toString().padLeft(2, '0')}:00';
  }

  static bool _contains(String text, List<String> terms) =>
      terms.any(text.contains);
}
