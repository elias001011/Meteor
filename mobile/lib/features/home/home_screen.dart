import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_controller.dart';
import '../../domain/weather_models.dart';
import '../../services/insight_engine.dart';
import '../../widgets/weather_condition_icon.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PageController? _pageController;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _pageController ??= PageController(
      initialPage: context.read<AppController>().selectedLocationIndex,
    );
  }

  @override
  void dispose() {
    _pageController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    final data = state.weather;
    if (data == null) {
      return SafeArea(
        child: Center(
          child: state.weatherState == LoadState.loading
              ? const _Loading()
              : _Empty(
                  message: state.weatherError,
                  retry: state.refreshWeather,
                  search: () => _showCitySearch(context),
                ),
        ),
      );
    }

    final heroHeight = (MediaQuery.sizeOf(context).height * .68).clamp(
      500.0,
      650.0,
    );
    return RefreshIndicator(
      onRefresh: state.refreshWeather,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: heroHeight,
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            leading: IconButton.filledTonal(
              tooltip: 'Localidades',
              onPressed: () => _showCitySearch(context),
              icon: const Icon(Icons.location_on_outlined),
            ),
            actions: [
              IconButton.filledTonal(
                tooltip: 'Pesquisar cidade',
                onPressed: () => _showCitySearch(context),
                icon: const Icon(Icons.search_rounded),
              ),
              const SizedBox(width: 4),
              IconButton.filledTonal(
                tooltip: 'Minha localização',
                onPressed: state.useCurrentLocation,
                icon: const Icon(Icons.my_location_rounded),
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _LocationsHero(
                controller: _pageController!,
                state: state,
              ),
            ),
          ),
          if (state.weatherError != null || data.isStale)
            SliverToBoxAdapter(
              child: MaterialBanner(
                leading: const Icon(Icons.cloud_off_rounded),
                content: Text(
                  data.isStale
                      ? 'Exibindo a última previsão salva.'
                      : state.weatherError!,
                ),
                actions: [
                  TextButton(
                    onPressed: state.refreshWeather,
                    child: const Text('Atualizar'),
                  ),
                ],
              ),
            ),
          SliverToBoxAdapter(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1100),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 22, 16, 36),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _Heading(
                        'Resumo inteligente',
                        Icons.auto_awesome_rounded,
                      ),
                      const SizedBox(height: 10),
                      _Insights(data),
                      if (data.alerts.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        const _Heading(
                          'Alertas oficiais',
                          Icons.warning_amber_rounded,
                        ),
                        const SizedBox(height: 10),
                        ...data.alerts.map(
                          (alert) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _Alert(alert),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      const _Heading('Agora', Icons.dashboard_outlined),
                      const SizedBox(height: 10),
                      _CurrentGrid(data.current),
                      if (data.airQuality != null) ...[
                        const SizedBox(height: 10),
                        _AirQualityCard(data.airQuality!),
                      ],
                      const SizedBox(height: 24),
                      const _Heading('Próximas horas', Icons.timeline_rounded),
                      const SizedBox(height: 10),
                      _Hourly(data.hourly),
                      const SizedBox(height: 24),
                      const _Heading(
                        'Próximos dias',
                        Icons.calendar_month_outlined,
                      ),
                      const SizedBox(height: 10),
                      _Daily(data.daily),
                      const SizedBox(height: 10),
                      _SunCard(data.current),
                      const SizedBox(height: 18),
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
    final state = context.read<AppController>();
    final city = await showModalBottomSheet<CityLocation>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: state,
        child: const _CitySearchSheet(),
      ),
    );
    if (city == null || !context.mounted) return;
    await state.addLocation(city);
    final index = state.selectedLocationIndex;
    if (_pageController?.hasClients == true) {
      await _pageController!.animateToPage(
        index,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    }
  }
}

class _LocationsHero extends StatelessWidget {
  const _LocationsHero({required this.controller, required this.state});

  final PageController controller;
  final AppController state;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      PageView.builder(
        controller: controller,
        itemCount: state.locations.length,
        onPageChanged: state.selectLocation,
        itemBuilder: (_, index) {
          final location = state.locations[index];
          final data = index == state.selectedLocationIndex
              ? state.weather
              : state.weatherForLocation(location);
          return _Hero(location: location, data: data);
        },
      ),
      if (state.locations.length > 1)
        Positioned(
          top: MediaQuery.paddingOf(context).top + 58,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              state.locations.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: index == state.selectedLocationIndex ? 18 : 6,
                height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: index == state.selectedLocationIndex
                      ? Colors.white
                      : Colors.white54,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ),
    ],
  );
}

class _Hero extends StatelessWidget {
  const _Hero({required this.location, required this.data});

  final CityLocation location;
  final WeatherBundle? data;

  @override
  Widget build(BuildContext context) {
    final current = data?.current;
    return Stack(
      fit: StackFit.expand,
      children: [
        _HeroImage(current?.imageUrl ?? '', current?.imageFallbackUrl),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: [0, .48, 1],
              colors: [Color(0x26000000), Color(0x18000000), Color(0xD9000000)],
            ),
          ),
        ),
        Positioned(
          left: 24,
          right: 24,
          bottom: 38,
          child: current == null
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(color: Colors.white),
                    const SizedBox(height: 14),
                    Text(
                      location.name,
                      style: const TextStyle(color: Colors.white, fontSize: 24),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${current.temperature.round()}°',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 82,
                        height: .9,
                        fontWeight: FontWeight.w300,
                        letterSpacing: -4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        WeatherConditionIcon(
                          condition: '${current.condition} ${current.icon}',
                          size: 30,
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Text(
                            current.condition,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 23,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 9),
                    Text(
                      '${current.city}${current.country.isEmpty ? '' : ', ${current.country}'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 17),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sensação de ${current.feelsLike.round()} °C',
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
        ),
        if (current?.imageAttribution != null)
          Positioned(
            right: 10,
            bottom: 7,
            child: _Credit(current!.imageAttribution!),
          ),
      ],
    );
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage(this.url, this.fallbackUrl);
  final String url;
  final String? fallbackUrl;

  @override
  Widget build(BuildContext context) {
    Widget placeholder() => const ColoredBox(
      color: Color(0xFF101726),
      child: Center(
        child: Icon(Icons.landscape_outlined, size: 72, color: Colors.white38),
      ),
    );
    if (url.isEmpty) return placeholder();
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (_, _) => placeholder(),
      errorWidget: (_, _, _) => fallbackUrl?.isNotEmpty == true
          ? CachedNetworkImage(
              imageUrl: fallbackUrl!,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => placeholder(),
            )
          : placeholder(),
    );
  }
}

class _Credit extends StatelessWidget {
  const _Credit(this.value);
  final ImageAttribution value;

  @override
  Widget build(BuildContext context) {
    final label = value.source.toLowerCase() == 'unsplash'
        ? '${value.photographer ?? 'Unsplash'} · Unsplash'
        : value.source;
    return InkWell(
      onTap: () {
        final uri = Uri.tryParse(value.photoUrl ?? value.photographerUrl ?? '');
        if (uri != null && {'http', 'https'}.contains(uri.scheme)) {
          launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 10,
          decoration: TextDecoration.underline,
          decorationColor: Colors.white54,
        ),
      ),
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.title, this.icon);
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

class _Insights extends StatelessWidget {
  const _Insights(this.data);
  final WeatherBundle data;

  @override
  Widget build(BuildContext context) {
    final values = InsightEngine.analyze(data);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: values.indexed.map((entry) {
            final insight = entry.$2;
            return Padding(
              padding: EdgeInsets.only(top: entry.$1 == 0 ? 0 : 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    _insightIcon(insight.severity),
                    size: entry.$1 == 0 ? 24 : 18,
                    color: _insightColor(context, insight.severity),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          insight.title,
                          style: entry.$1 == 0
                              ? Theme.of(context).textTheme.titleMedium
                              : Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          insight.body,
                          style: entry.$1 == 0
                              ? null
                              : Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
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

class _Metric {
  const _Metric(this.icon, this.label, this.value);
  final IconData icon;
  final String label;
  final String value;
}

class _CurrentGrid extends StatelessWidget {
  const _CurrentGrid(this.current);
  final CurrentWeather current;

  @override
  Widget build(BuildContext context) {
    final values = [
      _Metric(
        Icons.device_thermostat_outlined,
        'Sensação',
        '${current.feelsLike.round()}°',
      ),
      _Metric(Icons.air_rounded, 'Vento', '${current.windSpeed.round()} km/h'),
      _Metric(Icons.water_drop_outlined, 'Umidade', '${current.humidity}%'),
      _Metric(
        Icons.compress_rounded,
        'Pressão',
        '${current.pressure.round()} hPa',
      ),
      _Metric(
        Icons.visibility_outlined,
        'Visibilidade',
        current.visibility == null
            ? '—'
            : '${(current.visibility! / 1000).toStringAsFixed(1)} km',
      ),
      _Metric(
        Icons.wb_sunny_outlined,
        'Índice UV',
        current.uvIndex?.toStringAsFixed(1) ?? '—',
      ),
      _Metric(
        Icons.grain_rounded,
        'Precipitação',
        '${(current.rainLastHour ?? 0).toStringAsFixed(1)} mm',
      ),
      _Metric(
        Icons.cloud_outlined,
        'Nuvens',
        current.cloudCover == null ? '—' : '${current.cloudCover!.round()}%',
      ),
      _Metric(
        Icons.water_outlined,
        'Ponto de orvalho',
        current.dewPoint == null ? '—' : '${current.dewPoint!.round()}°',
      ),
      _Metric(
        Icons.storm_outlined,
        'Rajadas',
        current.windGust == null ? '—' : '${current.windGust!.round()} km/h',
      ),
    ];
    return LayoutBuilder(
      builder: (_, constraints) {
        final columns = constraints.maxWidth >= 760 ? 5 : 2;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: values.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: columns == 2 ? 1.8 : 1.35,
          ),
          itemBuilder: (_, index) => Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    values[index].icon,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          values[index].label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              ),
                        ),
                        const SizedBox(height: 2),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            values[index].value,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _AirQualityCard extends StatelessWidget {
  const _AirQualityCard(this.air);
  final AirQuality air;

  @override
  Widget build(BuildContext context) {
    final label = switch (air.index) {
      1 => 'Boa',
      2 => 'Razoável',
      3 => 'Moderada',
      4 => 'Ruim',
      5 => 'Muito ruim',
      _ => 'Sem classificação',
    };
    final values = [
      ('PM2.5', air.pm25),
      ('PM10', air.pm10),
      ('O₃', air.ozone),
      ('NO₂', air.nitrogenDioxide),
      ('SO₂', air.sulphurDioxide),
      ('CO', air.carbonMonoxide),
    ].where((item) => item.$2 != null);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(
                  Icons.air_rounded,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Qualidade do ar',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text('Índice ${air.index ?? '—'} · $label'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: values
                  .map(
                    (item) => Chip(
                      label: Text('${item.$1}  ${item.$2!.toStringAsFixed(1)}'),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _Hourly extends StatelessWidget {
  const _Hourly(this.items);
  final List<ForecastItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const Text('Previsão horária indisponível.');
    final visible = items.take(24).toList();
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
        child: SizedBox(
          height: 246,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: math.max(
                MediaQuery.sizeOf(context).width - 56,
                visible.length * 68,
              ),
              child: Column(
                children: [
                  SizedBox(
                    height: 112,
                    child: CustomPaint(
                      painter: _TemperaturePainter(
                        visible,
                        Theme.of(context).colorScheme.primary,
                        Theme.of(context).colorScheme.outlineVariant,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: Row(
                      children: visible
                          .map(
                            (item) => SizedBox(
                              width: 68,
                              child: Column(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  WeatherConditionIcon(
                                    condition:
                                        '${item.description} ${item.icon}',
                                    size: 27,
                                  ),
                                  Text(
                                    DateFormat.H('pt_BR')
                                        .format(_time(item.timestamp)),
                                  ),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(
                                        Icons.water_drop_rounded,
                                        size: 11,
                                        color: Color(0xFF48A9FF),
                                      ),
                                      Text(
                                        '${(item.rainProbability * 100).round()}%',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TemperaturePainter extends CustomPainter {
  const _TemperaturePainter(this.items, this.color, this.gridColor);
  final List<ForecastItem> items;
  final Color color;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (items.length < 2) return;
    final temperatures = items.map((item) => item.temperature).toList();
    final low = temperatures.reduce(math.min) - 1;
    final high = temperatures.reduce(math.max) + 1;
    final range = math.max(1.0, high - low);
    final step = size.width / items.length;
    final points = List.generate(
      items.length,
      (index) => Offset(
        step * index + step / 2,
        size.height -
            22 -
            ((temperatures[index] - low) / range) * (size.height - 38),
      ),
    );
    canvas.drawLine(
      Offset(0, size.height - 20),
      Offset(size.width, size.height - 20),
      Paint()..color = gridColor.withValues(alpha: .5),
    );
    final line = Path()..moveTo(points.first.dx, points.first.dy);
    for (final point in points.skip(1)) {
      line.lineTo(point.dx, point.dy);
    }
    final fill = Path.from(line)
      ..lineTo(points.last.dx, size.height - 20)
      ..lineTo(points.first.dx, size.height - 20)
      ..close();
    canvas.drawPath(
      fill,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [color.withValues(alpha: .3), color.withValues(alpha: .02)],
        ).createShader(Offset.zero & size),
    );
    canvas.drawPath(
      line,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
    final text = TextPainter(textDirection: TextDirection.ltr);
    for (var index = 0; index < points.length; index++) {
      text.text = TextSpan(
        text: '${temperatures[index].round()}°',
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      );
      text.layout();
      text.paint(
        canvas,
        Offset(points[index].dx - text.width / 2, points[index].dy - 19),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _TemperaturePainter oldDelegate) =>
      oldDelegate.items != items || oldDelegate.color != color;
}

class _Daily extends StatelessWidget {
  const _Daily(this.items);
  final List<ForecastItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const Text('Previsão diária indisponível.');
    final visible = items.take(7).toList();
    final low = visible
        .map((item) => item.minimumTemperature ?? item.temperature)
        .reduce(math.min);
    final high = visible.map((item) => item.temperature).reduce(math.max);
    return Card(
      child: Column(
        children: visible
            .map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 68,
                      child: Text(_dayLabel(_time(item.timestamp))),
                    ),
                    WeatherConditionIcon(
                      condition: '${item.description} ${item.icon}',
                      size: 26,
                    ),
                    const SizedBox(width: 6),
                    SizedBox(
                      width: 40,
                      child: Text(
                        '${(item.rainProbability * 100).round()}%',
                        style: const TextStyle(
                          color: Color(0xFF48A9FF),
                          fontSize: 12,
                        ),
                      ),
                    ),
                    Text('${item.minimumTemperature?.round() ?? '—'}°'),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _Range(
                        item.minimumTemperature ?? item.temperature,
                        item.temperature,
                        low,
                        high,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 28,
                      child: Text('${item.temperature.round()}°'),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _Range extends StatelessWidget {
  const _Range(this.minimum, this.maximum, this.low, this.high);
  final double minimum;
  final double maximum;
  final double low;
  final double high;

  @override
  Widget build(BuildContext context) {
    final range = math.max(1.0, high - low);
    return SizedBox(
      height: 6,
      child: LayoutBuilder(
        builder: (_, constraints) => Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            Positioned(
              left: constraints.maxWidth * ((minimum - low) / range),
              right: constraints.maxWidth * ((high - maximum) / range),
              top: 0,
              bottom: 0,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF56B4FF), Color(0xFFFFC43D)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SunCard extends StatelessWidget {
  const _SunCard(this.current);
  final CurrentWeather current;

  @override
  Widget build(BuildContext context) {
    final sunrise = _time(current.sunrise);
    final sunset = _time(current.sunset);
    final daylight = sunset.difference(sunrise);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.wb_twilight_rounded,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 12),
            _SunValue('Nascer', DateFormat.Hm('pt_BR').format(sunrise)),
            _SunValue(
              'Luz do dia',
              '${daylight.inHours}h ${daylight.inMinutes.remainder(60)}min',
            ),
            _SunValue('Pôr', DateFormat.Hm('pt_BR').format(sunset)),
          ],
        ),
      ),
    );
  }
}

class _SunValue extends StatelessWidget {
  const _SunValue(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 3),
        FittedBox(
          child: Text(value, style: Theme.of(context).textTheme.titleSmall),
        ),
      ],
    ),
  );
}

class _Alert extends StatelessWidget {
  const _Alert(this.alert);
  final WeatherAlert alert;

  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(18),
    );
    return Card(
      color: Theme.of(context).colorScheme.errorContainer,
      shape: shape,
      clipBehavior: Clip.antiAlias,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          shape: shape,
          collapsedShape: shape,
          leading: Icon(
            Icons.crisis_alert_rounded,
            color: Theme.of(context).colorScheme.onErrorContainer,
          ),
          title: Text(alert.event),
          subtitle: Text(alert.sender),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [Text(alert.description)],
        ),
      ),
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();
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

class _Empty extends StatelessWidget {
  const _Empty({required this.retry, required this.search, this.message});
  final VoidCallback retry;
  final VoidCallback search;
  final String? message;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(28),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.cloud_off_rounded, size: 56),
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
              onPressed: retry,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
            ),
            OutlinedButton.icon(
              onPressed: search,
              icon: const Icon(Icons.search),
              label: const Text('Pesquisar cidade'),
            ),
          ],
        ),
      ],
    ),
  );
}

class _CitySearchSheet extends StatefulWidget {
  const _CitySearchSheet();
  @override
  State<_CitySearchSheet> createState() => _CitySearchSheetState();
}

class _CitySearchSheetState extends State<_CitySearchSheet> {
  final input = TextEditingController();
  List<CityLocation> results = const [];
  bool loading = false;
  String? error;

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> search() async {
    if (input.text.trim().length < 2) return;
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final value = await context.read<AppController>().searchCities(
        input.text,
      );
      if (mounted) setState(() => results = value);
    } catch (exception) {
      if (mounted) setState(() => error = exception.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        8,
        20,
        MediaQuery.viewInsetsOf(context).bottom + 20,
      ),
      child: SizedBox(
        height: math.min(620, MediaQuery.sizeOf(context).height * .78),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Suas localidades',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 58,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: state.locations.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, index) => InputChip(
                  avatar: Icon(
                    index == state.selectedLocationIndex
                        ? Icons.location_on_rounded
                        : Icons.location_on_outlined,
                    size: 18,
                  ),
                  label: Text(state.locations[index].name),
                  selected: index == state.selectedLocationIndex,
                  onPressed: () async {
                    await state.selectLocation(index);
                    if (context.mounted) Navigator.pop(context);
                  },
                  onDeleted: state.locations.length <= 1
                      ? null
                      : () => state.removeLocation(index),
                ),
              ),
            ),
            TextField(
              controller: input,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => search(),
              decoration: InputDecoration(
                hintText: 'Adicionar cidade ou município',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  onPressed: search,
                  icon: const Icon(Icons.arrow_forward),
                ),
              ),
            ),
            if (loading) const LinearProgressIndicator(),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 8),
            Expanded(
              child: results.isEmpty && !loading
                  ? const Center(
                      child: Text(
                        'Pesquise para adicionar outra localidade.\nDepois, deslize a foto inicial para alternar.',
                        textAlign: TextAlign.center,
                      ),
                    )
                  : ListView.builder(
                      itemCount: results.length,
                      itemBuilder: (_, index) {
                        final city = results[index];
                        return ListTile(
                          leading: const Icon(Icons.add_location_alt_outlined),
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
  return DateFormat.E('pt_BR')
      .format(date)
      .replaceFirstMapped(RegExp(r'^.'), (match) => match[0]!.toUpperCase());
}
