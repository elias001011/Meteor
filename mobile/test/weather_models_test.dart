import 'package:flutter_test/flutter_test.dart';
import 'package:meteor/domain/weather_models.dart';

void main() {
  test('WeatherBundle tolera campos opcionais e lê atribuição', () {
    final result = WeatherBundle.fromJson({
      'weatherData': {
        'city': 'Curitiba',
        'country': 'BR',
        'dt': 1750000000,
        'temperature': 18.4,
        'feels_like': 17.1,
        'condition': 'Nublado',
        'conditionIcon': '☁️',
        'windSpeed': 12,
        'humidity': 80,
        'pressure': 1015,
        'imageUrl': 'https://images.example/photo.jpg',
        'sunrise': 1749960000,
        'sunset': 1750000000,
        'imageAttribution': {
          'source': 'Unsplash',
          'photographer': 'Ana',
          'photoUrl': 'https://unsplash.com/photos/abc',
        },
      },
      'hourlyForecast': [],
      'dailyForecast': [],
      'alerts': [],
      'dataSource': 'open-meteo',
    });

    expect(result.current.city, 'Curitiba');
    expect(result.current.imageAttribution?.photographer, 'Ana');
    expect(result.dataSource, 'open-meteo');
    expect(result.airQuality, isNull);
  });

  test('CityLocation serializa coordenadas para o cache', () {
    const city = CityLocation(
      name: 'Recife',
      country: 'BR',
      state: 'Pernambuco',
      latitude: -8.05,
      longitude: -34.9,
    );

    expect(CityLocation.fromJson(city.toJson()).name, 'Recife');
    expect(CityLocation.fromJson(city.toJson()).longitude, -34.9);
  });
}
