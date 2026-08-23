import 'package:flutter_test/flutter_test.dart';
import 'package:meteor/data/local_store.dart';
import 'package:meteor/domain/weather_models.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('salva várias localidades e o índice selecionado', () async {
    SharedPreferences.setMockInitialValues({});
    final store = LocalStore(await SharedPreferences.getInstance());
    const cities = [
      CityLocation(
        name: 'Recife',
        country: 'BR',
        latitude: -8.05,
        longitude: -34.9,
      ),
      CityLocation(
        name: 'Curitiba',
        country: 'BR',
        latitude: -25.43,
        longitude: -49.27,
      ),
    ];

    await store.saveLocations(cities, 1);

    expect(store.readLocations().map((city) => city.name), [
      'Recife',
      'Curitiba',
    ]);
    expect(store.readSelectedLocationIndex(), 1);
    expect(store.readLocation()?.name, 'Curitiba');
  });
}
