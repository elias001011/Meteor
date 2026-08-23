import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:meteor/app_controller.dart';
import 'package:meteor/data/bff_client.dart';
import 'package:meteor/data/local_store.dart';
import 'package:meteor/domain/weather_models.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _DelayedWeatherClient extends BffClient {
  final requests = <String, Completer<Json>>{};

  @override
  Future<Json> fetchWeatherJson(CityLocation location, {String? imageNonce}) {
    return (requests[location.storageKey] ??= Completer<Json>()).future;
  }
}

Json _weather(String city) => {
  'weatherData': {
    'city': city,
    'country': 'BR',
    'temperature': 20,
    'feels_like': 20,
    'condition': 'Céu limpo',
    'conditionIcon': 'clear',
    'windSpeed': 5,
    'humidity': 50,
    'pressure': 1015,
    'imageUrl': '',
    'sunrise': 1,
    'sunset': 2,
  },
  'hourlyForecast': <Object>[],
  'dailyForecast': <Object>[],
  'alerts': <Object>[],
};

void main() {
  test('resposta atrasada não substitui a localidade selecionada', () async {
    SharedPreferences.setMockInitialValues({});
    final client = _DelayedWeatherClient();
    final controller = AppController(
      store: LocalStore(await SharedPreferences.getInstance()),
      client: client,
    );
    const cities = [
      CityLocation(
        name: 'Cidade A',
        country: 'BR',
        latitude: -10,
        longitude: -40,
      ),
      CityLocation(
        name: 'Cidade B',
        country: 'BR',
        latitude: -20,
        longitude: -50,
      ),
    ];
    controller.locations = cities;

    final first = controller.selectLocation(0);
    for (
      var attempt = 0;
      attempt < 20 && !client.requests.containsKey(cities[0].storageKey);
      attempt++
    ) {
      await Future<void>.delayed(const Duration(milliseconds: 5));
    }
    final second = controller.selectLocation(1);
    for (
      var attempt = 0;
      attempt < 20 && !client.requests.containsKey(cities[1].storageKey);
      attempt++
    ) {
      await Future<void>.delayed(const Duration(milliseconds: 5));
    }
    expect(
      client.requests.keys,
      containsAll(cities.map((city) => city.storageKey)),
    );
    client.requests[cities[1].storageKey]!.complete(_weather('Cidade B'));
    await second;
    client.requests[cities[0].storageKey]!.complete(_weather('Cidade A'));
    await first;

    expect(controller.selectedLocationIndex, 1);
    expect(controller.location.name, 'Cidade B');
    expect(controller.weather?.current.city, 'Cidade B');
  });

  test('reordena localidades preservando a localidade selecionada', () async {
    SharedPreferences.setMockInitialValues({});
    final controller = AppController(
      store: LocalStore(await SharedPreferences.getInstance()),
    );
    const cities = [
      CityLocation(
        name: 'Cidade A',
        country: 'BR',
        latitude: -10,
        longitude: -40,
      ),
      CityLocation(
        name: 'Cidade B',
        country: 'BR',
        latitude: -20,
        longitude: -50,
      ),
    ];
    controller.locations = cities;
    controller.selectedLocationIndex = 1;
    controller.location = cities[1];

    await controller.reorderLocation(1, 0);

    expect(controller.locations.map((city) => city.name), [
      'Cidade B',
      'Cidade A',
    ]);
    expect(controller.selectedLocationIndex, 0);
    expect(controller.location.name, 'Cidade B');
  });
}
