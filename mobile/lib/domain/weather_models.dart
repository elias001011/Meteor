typedef Json = Map<String, dynamic>;

double _number(Object? value, [double fallback = 0]) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? fallback;
}

int _integer(Object? value, [int fallback = 0]) {
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

String _text(Object? value, [String fallback = '']) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

Json _json(Object? value) => value is Map<String, dynamic> ? value : const {};

List<Json> _jsonList(Object? value) => value is List
    ? value
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList()
    : const [];

class CityLocation {
  const CityLocation({
    required this.name,
    required this.country,
    required this.latitude,
    required this.longitude,
    this.state,
  });

  factory CityLocation.fromJson(Json json) => CityLocation(
    name: _text(json['name'], 'Localização'),
    country: _text(json['country']),
    state: _text(json['state']).isEmpty ? null : _text(json['state']),
    latitude: _number(json['lat']),
    longitude: _number(json['lon']),
  );

  final String name;
  final String country;
  final String? state;
  final double latitude;
  final double longitude;

  Json toJson() => {
    'name': name,
    'country': country,
    if (state != null) 'state': state,
    'lat': latitude,
    'lon': longitude,
  };

  String get storageKey =>
      '${latitude.toStringAsFixed(3)},${longitude.toStringAsFixed(3)}';
}

class ImageAttribution {
  const ImageAttribution({
    required this.source,
    this.photographer,
    this.photographerUrl,
    this.photoUrl,
  });

  factory ImageAttribution.fromJson(Json json) => ImageAttribution(
    source: _text(json['source'], 'Picsum'),
    photographer: _text(json['photographer']).isEmpty
        ? null
        : _text(json['photographer']),
    photographerUrl: _text(json['photographerUrl']).isEmpty
        ? null
        : _text(json['photographerUrl']),
    photoUrl: _text(json['photoUrl']).isEmpty ? null : _text(json['photoUrl']),
  );

  final String source;
  final String? photographer;
  final String? photographerUrl;
  final String? photoUrl;
}

class CurrentWeather {
  const CurrentWeather({
    required this.city,
    required this.country,
    required this.timestamp,
    required this.temperature,
    required this.feelsLike,
    required this.condition,
    required this.icon,
    required this.windSpeed,
    required this.humidity,
    required this.pressure,
    required this.imageUrl,
    required this.sunrise,
    required this.sunset,
    this.imageFallbackUrl,
    this.imageAttribution,
    this.uvIndex,
    this.visibility,
    this.windGust,
    this.rainLastHour,
    this.dewPoint,
    this.cloudCover,
    this.windDirection,
  });

  factory CurrentWeather.fromJson(Json json) {
    final attribution = _json(json['imageAttribution']);
    return CurrentWeather(
      city: _text(json['city'], 'Localização'),
      country: _text(json['country']),
      timestamp: _integer(json['dt']),
      temperature: _number(json['temperature']),
      feelsLike: _number(json['feels_like'], _number(json['temperature'])),
      condition: _text(json['condition'], 'Condição indisponível'),
      icon: _text(json['conditionIcon'], '•'),
      windSpeed: _number(json['windSpeed']),
      humidity: _integer(json['humidity']),
      pressure: _number(json['pressure']),
      imageUrl: _text(json['imageUrl']),
      imageFallbackUrl: _text(json['imageFallbackUrl']).isEmpty
          ? null
          : _text(json['imageFallbackUrl']),
      imageAttribution: attribution.isEmpty
          ? null
          : ImageAttribution.fromJson(attribution),
      sunrise: _integer(json['sunrise']),
      sunset: _integer(json['sunset']),
      uvIndex: json['uvi'] == null ? null : _number(json['uvi']),
      visibility: json['visibility'] == null
          ? null
          : _number(json['visibility']),
      windGust: json['wind_gust'] == null ? null : _number(json['wind_gust']),
      rainLastHour: json['rain_1h'] == null ? null : _number(json['rain_1h']),
      dewPoint: json['dew_point'] == null ? null : _number(json['dew_point']),
      cloudCover: json['clouds'] == null ? null : _number(json['clouds']),
      windDirection: json['wind_deg'] == null
          ? null
          : _number(json['wind_deg']),
    );
  }

  final String city;
  final String country;
  final int timestamp;
  final double temperature;
  final double feelsLike;
  final String condition;
  final String icon;
  final double windSpeed;
  final int humidity;
  final double pressure;
  final double? uvIndex;
  final double? visibility;
  final double? windGust;
  final double? rainLastHour;
  final double? dewPoint;
  final double? cloudCover;
  final double? windDirection;
  final int sunrise;
  final int sunset;
  final String imageUrl;
  final String? imageFallbackUrl;
  final ImageAttribution? imageAttribution;
}

class ForecastItem {
  const ForecastItem({
    required this.timestamp,
    required this.temperature,
    required this.icon,
    required this.description,
    required this.rainProbability,
    this.minimumTemperature,
    this.feelsLike,
    this.humidity,
    this.windSpeed,
    this.windGust,
    this.uvIndex,
    this.sunrise,
    this.sunset,
    this.precipitation,
    this.cloudCover,
    this.pressure,
    this.dewPoint,
  });

  factory ForecastItem.fromJson(Json json) => ForecastItem(
    timestamp: _integer(json['dt']),
    temperature: _number(json['temperature']),
    minimumTemperature: json['temperature_min'] == null
        ? null
        : _number(json['temperature_min']),
    icon: _text(json['conditionIcon'], '•'),
    description: _text(json['description'], 'Sem descrição'),
    rainProbability: _number(json['pop']),
    feelsLike: json['feels_like'] == null ? null : _number(json['feels_like']),
    humidity: json['humidity'] == null ? null : _integer(json['humidity']),
    windSpeed: json['wind_speed'] == null ? null : _number(json['wind_speed']),
    windGust: json['wind_gust'] == null ? null : _number(json['wind_gust']),
    uvIndex: json['uvi'] == null ? null : _number(json['uvi']),
    sunrise: json['sunrise'] == null ? null : _integer(json['sunrise']),
    sunset: json['sunset'] == null ? null : _integer(json['sunset']),
    precipitation: json['precipitation'] == null
        ? null
        : _number(json['precipitation']),
    cloudCover: json['clouds'] == null ? null : _number(json['clouds']),
    pressure: json['pressure'] == null ? null : _number(json['pressure']),
    dewPoint: json['dew_point'] == null ? null : _number(json['dew_point']),
  );

  final int timestamp;
  final double temperature;
  final double? minimumTemperature;
  final String icon;
  final String description;
  final double rainProbability;
  final double? feelsLike;
  final int? humidity;
  final double? windSpeed;
  final double? windGust;
  final double? uvIndex;
  final int? sunrise;
  final int? sunset;
  final double? precipitation;
  final double? cloudCover;
  final double? pressure;
  final double? dewPoint;
}

class WeatherAlert {
  const WeatherAlert({
    required this.event,
    required this.description,
    required this.sender,
    required this.start,
    required this.end,
    required this.tags,
  });

  factory WeatherAlert.fromJson(Json json) => WeatherAlert(
    event: _text(json['event'], 'Alerta meteorológico'),
    description: _text(json['description']),
    sender: _text(json['sender_name'], 'Fonte meteorológica'),
    start: _integer(json['start']),
    end: _integer(json['end']),
    tags: json['tags'] is List
        ? (json['tags'] as List).map((item) => item.toString()).toList()
        : const [],
  );

  final String event;
  final String description;
  final String sender;
  final int start;
  final int end;
  final List<String> tags;
}

class AirQuality {
  const AirQuality({
    required this.index,
    required this.pm25,
    this.pm10,
    this.ozone,
    this.nitrogenDioxide,
    this.sulphurDioxide,
    this.carbonMonoxide,
  });

  factory AirQuality.fromJson(Json json) {
    final components = _json(json['components']);
    return AirQuality(
      index: json['aqi'] == null ? null : _integer(json['aqi']),
      pm25: components['pm2_5'] == null ? null : _number(components['pm2_5']),
      pm10: components['pm10'] == null ? null : _number(components['pm10']),
      ozone: components['o3'] == null ? null : _number(components['o3']),
      nitrogenDioxide: components['no2'] == null
          ? null
          : _number(components['no2']),
      sulphurDioxide: components['so2'] == null
          ? null
          : _number(components['so2']),
      carbonMonoxide: components['co'] == null
          ? null
          : _number(components['co']),
    );
  }

  final int? index;
  final double? pm25;
  final double? pm10;
  final double? ozone;
  final double? nitrogenDioxide;
  final double? sulphurDioxide;
  final double? carbonMonoxide;
}

class WeatherBundle {
  const WeatherBundle({
    required this.current,
    required this.hourly,
    required this.daily,
    required this.alerts,
    required this.dataSource,
    required this.fetchedAt,
    this.airQuality,
    this.isStale = false,
  });

  factory WeatherBundle.fromJson(
    Json json, {
    bool isStale = false,
    DateTime? fetchedAt,
  }) => WeatherBundle(
    current: CurrentWeather.fromJson(_json(json['weatherData'])),
    hourly: _jsonList(json['hourlyForecast'])
        .map(ForecastItem.fromJson)
        .toList(),
    daily: _jsonList(json['dailyForecast']).map(ForecastItem.fromJson).toList(),
    alerts: _jsonList(json['alerts']).map(WeatherAlert.fromJson).toList(),
    airQuality: _json(json['airQualityData']).isEmpty
        ? null
        : AirQuality.fromJson(_json(json['airQualityData'])),
    dataSource: _text(json['dataSource'], 'auto'),
    fetchedAt: fetchedAt ?? DateTime.now(),
    isStale: isStale,
  );

  final CurrentWeather current;
  final List<ForecastItem> hourly;
  final List<ForecastItem> daily;
  final List<WeatherAlert> alerts;
  final AirQuality? airQuality;
  final String dataSource;
  final DateTime fetchedAt;
  final bool isStale;

  Json toContextJson() => {
    'weatherData': {
      'city': current.city,
      'country': current.country,
      'temperature': current.temperature,
      'feels_like': current.feelsLike,
      'condition': current.condition,
      'humidity': current.humidity,
      'windSpeed': current.windSpeed,
      'wind_gust': current.windGust,
      'pressure': current.pressure,
      'visibility': current.visibility,
      'dew_point': current.dewPoint,
      'uvi': current.uvIndex,
    },
    'hourlyForecast': hourly
        .take(8)
        .map(
          (item) => {
            'dt': item.timestamp,
            'temperature': item.temperature,
            'description': item.description,
            'pop': item.rainProbability,
            'feels_like': item.feelsLike,
            'humidity': item.humidity,
            'wind_speed': item.windSpeed,
          },
        )
        .toList(),
    'dailyForecast': daily
        .take(7)
        .map(
          (item) => {
            'dt': item.timestamp,
            'temperature': item.temperature,
            'temperature_min': item.minimumTemperature,
            'description': item.description,
            'pop': item.rainProbability,
            'uvi': item.uvIndex,
          },
        )
        .toList(),
    'alerts': alerts
        .map((item) => {'event': item.event, 'description': item.description})
        .toList(),
    if (airQuality != null)
      'airQuality': {
        'index': airQuality!.index,
        'pm2_5': airQuality!.pm25,
        'pm10': airQuality!.pm10,
        'o3': airQuality!.ozone,
      },
    'dataSource': dataSource,
  };
}
