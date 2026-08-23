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
    final nextHours = data.hourly.take(4);

    if (_contains(condition, ['tempest', 'trovo', 'thunder', 'granizo'])) {
      result.add(
        const WeatherInsight(
          title: 'Tempestade na região',
          body: 'Evite áreas abertas e acompanhe os alertas oficiais locais.',
          severity: InsightSeverity.severe,
        ),
      );
    }

    final rainSoon = nextHours.any((hour) => hour.rainProbability >= .6);
    if (current.rainLastHour != null && current.rainLastHour! >= 5) {
      result.add(
        const WeatherInsight(
          title: 'Chuva intensa agora',
          body: 'Redobre a atenção em deslocamentos e não atravesse áreas alagadas.',
          severity: InsightSeverity.warning,
        ),
      );
    } else if (rainSoon && !_contains(condition, ['chuv', 'garoa', 'rain'])) {
      result.add(
        const WeatherInsight(
          title: 'Chuva provável nas próximas horas',
          body: 'Considere levar proteção e confira a previsão antes de sair.',
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

    if ((current.uvIndex ?? 0) >= 8) {
      result.add(
        const WeatherInsight(
          title: 'Índice UV muito alto',
          body: 'Evite exposição prolongada nos horários de maior radiação.',
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

    if (result.isEmpty) {
      result.add(
        WeatherInsight(
          title: 'Tempo estável em ${current.city}',
          body: _normalSummary(data),
          severity: InsightSeverity.normal,
        ),
      );
    }

    result.sort((a, b) => b.severity.index.compareTo(a.severity.index));
    return result.take(4).toList();
  }

  static String _normalSummary(WeatherBundle data) {
    final current = data.current;
    final daily = data.daily.isEmpty ? null : data.daily.first;
    if (daily != null && daily.minimumTemperature != null) {
      return '${current.condition}. Hoje varia entre ${daily.minimumTemperature!.round()} °C e ${daily.temperature.round()} °C.';
    }
    return '${current.condition}, sensação de ${current.feelsLike.round()} °C e sem risco relevante detectado agora.';
  }

  static bool _contains(String text, List<String> terms) =>
      terms.any(text.contains);
}
