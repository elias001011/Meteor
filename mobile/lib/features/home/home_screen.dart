import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_controller.dart';
import '../../domain/weather_models.dart';
import '../../services/insight_engine.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    final data = state.weather;
    if (data == null) {
      return SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: state.weatherState == LoadState.loading
                ? const _WeatherLoading()
                : _EmptyWeather(
                    message: state.weatherError,
                    onRetry: state.refreshWeather,
                    onSearch: () => _showCitySearch(context),
                  ),
          ),
        ),
      );
    }

    final current = data.current;
    return RefreshIndicator(
      onRefresh: state.refreshWeather,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 350,
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: Text(current.city),
            actions: [
              IconButton(
                tooltip: 'Pesquisar cidade',
                onPressed: () => _showCitySearch(context),
                icon: const Icon(Icons.search_rounded),
              ),
              IconButton(
                tooltip: 'Usar minha localização',
                onPressed: state.useCurrentLocation,
                icon: const Icon(Icons.my_location_rounded),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _WeatherHero(data: data),
            ),
          ),
          if (state.weatherError != null || data.isStale)
            SliverToBoxAdapter(
              child: _StatusBanner(
                message: data.isStale
                    ? 'Exibindo a última previsão salva. Puxe para atualizar.'
                    : state.weatherError!,
              ),
            ),
          SliverToBoxAdapter(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1100),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 36),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _SectionHeader(
                        title: 'Resumo inteligente',
                        icon: Icons.auto_awesome_rounded,
                      ),
                      const SizedBox(height: 10),
                      _InsightsCard(data: data),
                      if (data.alerts.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        const _SectionHeader(
                          title: 'Alertas oficiais',
                          icon: Icons.warning_amber_rounded,
                        ),
                        const SizedBox(height: 10),
                        ...data.alerts.map(
                          (alert) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _OfficialAlertCard(alert: alert),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      const _SectionHeader(
                        title: 'Agora',
                        icon: Icons.grid_view_rounded,
                      ),
                      const SizedBox(height: 10),
                      _DetailsGrid(current: current, air: data.airQuality),
                      const SizedBox(height: 24),
                      const _SectionHeader(
                        title: 'Próximas horas',
                        icon: Icons.schedule_rounded,
                      ),
                      const SizedBox(height: 10),
                      _HourlyForecast(items: data.hourly),
                      const SizedBox(height: 24),
                      const _SectionHeader(
                        title: 'Próximos dias',
                        icon: Icons.calendar_month_rounded,
                      ),
                      const SizedBox(height: 10),
                      _DailyForecast(items: data.daily),
                      const SizedBox(height: 12),
                      Text(
                        'Dados: ${data.dataSource} • atualizado ${DateFormat.Hm('pt_BR').format(data.fetchedAt)}',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showCitySearch(BuildContext context) async {
    final city = await showModalBottomSheet<CityLocation>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<AppController>(),
        child: const _CitySearchSheet(),
      ),
    );
    if (city != null && context.mounted) {
      await context.read<AppController>().refreshWeather(nextLocation: city);
    }
  }
}

class _WeatherHero extends StatelessWidget {
  const _WeatherHero({required this.data});

  final WeatherBundle data;

  @override
  Widget build(BuildContext context) {
    final current = data.current;
    return Stack(
      fit: StackFit.expand,
      children: [
        _HeroImage(
          url: current.imageUrl,
          fallbackUrl: current.imageFallbackUrl,
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x33000000), Color(0xD9000000)],
            ),
          ),
        ),
        Positioned(
          left: 22,
          right: 22,
          bottom: 24,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${current.temperature.round()}°',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 72,
                        height: .9,
                        fontWeight: FontWeight.w300,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      current.condition,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sensação de ${current.feelsLike.round()} °C • ${current.city}${current.country.isEmpty ? '' : ', ${current.country}'}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              Text(current.icon, style: const TextStyle(fontSize: 50)),
            ],
          ),
        ),
        if (current.imageAttribution != null)
          Positioned(
            right: 12,
            bottom: 6,
            child: _ImageCredit(attribution: current.imageAttribution!),
          ),
      ],
    );
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage({required this.url, this.fallbackUrl});

  final String url;
  final String? fallbackUrl;

  @override
  Widget build(BuildContext context) {
    Widget fallback() => DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.tertiary,
          ],
        ),
      ),
      child: const Center(
        child: Icon(Icons.landscape_rounded, size: 72, color: Colors.white54),
      ),
    );

    if (url.isEmpty) return fallback();
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, _) => fallback(),
      errorWidget: (_, _, _) {
        if (fallbackUrl?.isNotEmpty == true && fallbackUrl != url) {
          return CachedNetworkImage(
            imageUrl: fallbackUrl!,
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => fallback(),
          );
        }
        return fallback();
      },
    );
  }
}

class _ImageCredit extends StatelessWidget {
  const _ImageCredit({required this.attribution});

  final ImageAttribution attribution;

  @override
  Widget build(BuildContext context) {
    final label = attribution.source.toLowerCase() == 'unsplash'
        ? 'Foto: ${attribution.photographer ?? 'Unsplash'} / Unsplash'
        : 'Imagem: ${attribution.source}';
    return InkWell(
      onTap: () {
        final url = attribution.photoUrl ?? attribution.photographerUrl;
        if (url != null) {
          launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.black54,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 10),
        ),
      ),
    );
  }
}

class _InsightsCard extends StatelessWidget {
  const _InsightsCard({required this.data});

  final WeatherBundle data;

  @override
  Widget build(BuildContext context) {
    final insights = InsightEngine.analyze(data);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: insights
              .map(
                (insight) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        _insightIcon(insight.severity),
                        color: _insightColor(context, insight.severity),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              insight.title,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              insight.body,
                              style: TextStyle(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  IconData _insightIcon(InsightSeverity value) => switch (value) {
    InsightSeverity.normal => Icons.check_circle_outline_rounded,
    InsightSeverity.attention => Icons.info_outline_rounded,
    InsightSeverity.warning => Icons.warning_amber_rounded,
    InsightSeverity.severe => Icons.crisis_alert_rounded,
  };

  Color _insightColor(BuildContext context, InsightSeverity value) =>
      switch (value) {
        InsightSeverity.normal => Theme.of(context).colorScheme.primary,
        InsightSeverity.attention => Colors.amber.shade700,
        InsightSeverity.warning ||
        InsightSeverity.severe => Theme.of(context).colorScheme.error,
      };
}

class _DetailsGrid extends StatelessWidget {
  const _DetailsGrid({required this.current, this.air});

  final CurrentWeather current;
  final AirQuality? air;

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.air_rounded, 'Vento', '${current.windSpeed.round()} km/h'),
      (Icons.water_drop_outlined, 'Umidade', '${current.humidity}%'),
      (Icons.compress_rounded, 'Pressão', '${current.pressure.round()} hPa'),
      (
        Icons.visibility_outlined,
        'Visibilidade',
        current.visibility == null
            ? '—'
            : '${(current.visibility! / 1000).toStringAsFixed(1)} km',
      ),
      (
        Icons.wb_sunny_outlined,
        'Índice UV',
        current.uvIndex?.toStringAsFixed(1) ?? '—',
      ),
      (
        Icons.eco_outlined,
        'Qualidade do ar',
        air?.index == null ? 'Sem dados' : 'Nível ${air!.index}',
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 760 ? 6 : 3;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: columns == 6 ? 1.15 : .9,
          ),
          itemBuilder: (context, index) {
            final item = items[index];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(item.$1, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(height: 8),
                    Text(
                      item.$2,
                      style: Theme.of(context).textTheme.labelMedium,
                    ),
                    const SizedBox(height: 3),
                    FittedBox(
                      child: Text(
                        item.$3,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _HourlyForecast extends StatelessWidget {
  const _HourlyForecast({required this.items});

  final List<ForecastItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const Text('Previsão horária indisponível.');
    return SizedBox(
      height: 152,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = items[index];
          return Card(
            child: SizedBox(
              width: 96,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(DateFormat.Hm('pt_BR').format(_time(item.timestamp))),
                    Text(item.icon, style: const TextStyle(fontSize: 27)),
                    Text(
                      '${(item.rainProbability * 100).round()}%',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    Text(
                      '${item.temperature.round()}°',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DailyForecast extends StatelessWidget {
  const _DailyForecast({required this.items});

  final List<ForecastItem> items;

  @override
  Widget build(BuildContext context) => Card(
    child: Column(
      children: items.take(7).map((item) {
        final date = _time(item.timestamp);
        return ListTile(
          leading: Text(item.icon, style: const TextStyle(fontSize: 26)),
          title: Text(_dayLabel(date)),
          subtitle: Text(
            item.description,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Text(
            '${item.minimumTemperature?.round() ?? '—'}°  ${item.temperature.round()}°',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        );
      }).toList(),
    ),
  );
}

class _OfficialAlertCard extends StatelessWidget {
  const _OfficialAlertCard({required this.alert});

  final WeatherAlert alert;

  @override
  Widget build(BuildContext context) => Card(
    color: Theme.of(context).colorScheme.errorContainer,
    child: ExpansionTile(
      leading: Icon(
        Icons.crisis_alert_rounded,
        color: Theme.of(context).colorScheme.onErrorContainer,
      ),
      title: Text(alert.event),
      subtitle: Text(alert.sender),
      childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [Text(alert.description)],
    ),
  );
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => MaterialBanner(
    content: Text(message),
    leading: const Icon(Icons.cloud_off_rounded),
    actions: [
      TextButton(
        onPressed: context.read<AppController>().refreshWeather,
        child: const Text('Tentar novamente'),
      ),
    ],
  );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: 8),
      Text(title, style: Theme.of(context).textTheme.titleLarge),
    ],
  );
}

class _WeatherLoading extends StatelessWidget {
  const _WeatherLoading();

  @override
  Widget build(BuildContext context) => const Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      CircularProgressIndicator(),
      SizedBox(height: 18),
      Text('Lendo o céu…'),
    ],
  );
}

class _EmptyWeather extends StatelessWidget {
  const _EmptyWeather({
    required this.onRetry,
    required this.onSearch,
    this.message,
  });

  final VoidCallback onRetry;
  final VoidCallback onSearch;
  final String? message;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(
        Icons.cloud_off_rounded,
        size: 56,
        color: Theme.of(context).colorScheme.primary,
      ),
      const SizedBox(height: 16),
      Text(
        message ?? 'Ainda não há previsão disponível.',
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: 20),
      Wrap(
        spacing: 8,
        children: [
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Tentar novamente'),
          ),
          OutlinedButton.icon(
            onPressed: onSearch,
            icon: const Icon(Icons.search),
            label: const Text('Pesquisar cidade'),
          ),
        ],
      ),
    ],
  );
}

class _CitySearchSheet extends StatefulWidget {
  const _CitySearchSheet();

  @override
  State<_CitySearchSheet> createState() => _CitySearchSheetState();
}

class _CitySearchSheetState extends State<_CitySearchSheet> {
  final _input = TextEditingController();
  List<CityLocation> _results = const [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    if (_input.text.trim().length < 2) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await context.read<AppController>().searchCities(
        _input.text,
      );
      if (mounted) setState(() => _results = result);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      20,
      8,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 20,
    ),
    child: SizedBox(
      height: 440,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Escolher localidade',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _input,
            autofocus: true,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _search(),
            decoration: InputDecoration(
              hintText: 'Cidade ou município',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                onPressed: _search,
                icon: const Icon(Icons.arrow_forward),
              ),
            ),
          ),
          if (_loading) const LinearProgressIndicator(),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          const SizedBox(height: 10),
          Expanded(
            child: _results.isEmpty && !_loading
                ? const Center(
                    child: Text('Digite ao menos 2 letras para pesquisar.'),
                  )
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final city = _results[index];
                      return ListTile(
                        leading: const Icon(Icons.location_city_rounded),
                        title: Text(city.name),
                        subtitle: Text(
                          [
                            if (city.state != null) city.state!,
                            city.country,
                          ].join(', '),
                        ),
                        onTap: () => Navigator.pop(context, city),
                      );
                    },
                  ),
          ),
        ],
      ),
    ),
  );
}

DateTime _time(int seconds) =>
    DateTime.fromMillisecondsSinceEpoch(seconds * 1000);

String _dayLabel(DateTime date) {
  final today = DateTime.now();
  if (date.year == today.year &&
      date.month == today.month &&
      date.day == today.day) {
    return 'Hoje';
  }
  return DateFormat.EEEE('pt_BR')
      .format(date)
      .replaceFirstMapped(RegExp(r'^.'), (m) => m[0]!.toUpperCase());
}
