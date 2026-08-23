import '../core/app_config.dart';
import '../domain/content_models.dart';
import '../domain/weather_models.dart';
import 'bff_client.dart';
import 'local_store.dart';

class WeatherRepository {
  WeatherRepository(this._client, this._store);

  final BffClient _client;
  final LocalStore _store;

  WeatherBundle? readCache({bool allowExpired = true}) {
    final cached = _store.readWeather();
    if (cached == null) return null;
    final expired =
        DateTime.now().difference(cached.savedAt) > AppConfig.weatherCacheTtl;
    if (expired && !allowExpired) return null;
    return WeatherBundle.fromJson(
      cached.data,
      isStale: expired,
      fetchedAt: cached.savedAt,
    );
  }

  Future<WeatherBundle> refresh(
    CityLocation location, {
    String? imageNonce,
    bool allowCacheFallback = true,
    bool Function()? shouldPersist,
  }) async {
    try {
      final raw = await _client.fetchWeatherJson(
        location,
        imageNonce: imageNonce,
      );
      if (shouldPersist?.call() ?? true) await _store.saveWeather(raw);
      return WeatherBundle.fromJson(raw);
    } catch (_) {
      final cache = allowCacheFallback ? readCache() : null;
      if (cache != null) return cache;
      rethrow;
    }
  }

  Future<List<CityLocation>> search(String query) =>
      _client.searchCities(query);
}

class NewsRepository {
  NewsRepository(this._client, this._store);

  final BffClient _client;
  final LocalStore _store;

  Future<List<NewsArticle>> fetch({String? category, String? query}) async {
    try {
      final articles = await _client.fetchNews(
        category: category,
        query: query,
      );
      await _store.saveNews({
        'articles': articles
            .map(
              (item) => {
                'title': item.title,
                'description': item.description,
                'content': item.content,
                'url': item.url,
                'image': item.imageUrl,
                'publishedAt': item.publishedAt.toIso8601String(),
                'source': {'name': item.source},
              },
            )
            .toList(),
      });
      return articles;
    } catch (_) {
      if (query?.trim().isNotEmpty == true || category != null) rethrow;
      final cached = _store.readNews();
      final values = cached?.data['articles'];
      if (values is List) {
        return values
            .whereType<Map>()
            .map(
              (item) => NewsArticle.fromJson(Map<String, dynamic>.from(item)),
            )
            .toList();
      }
      rethrow;
    }
  }
}
