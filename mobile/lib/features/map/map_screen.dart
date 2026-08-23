import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_controller.dart';
import '../../core/app_config.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final _mapController = MapController();
  String _layer = 'PR0';
  double _opacity = .68;
  String? _lastLocationKey;

  static const _layers = <String, ({String label, IconData icon})>{
    'PR0': (label: 'Chuva', icon: Icons.water_drop_outlined),
    'CL': (label: 'Nuvens', icon: Icons.cloud_outlined),
    'TA2': (label: 'Temperatura', icon: Icons.device_thermostat_outlined),
    'WS10': (label: 'Vento', icon: Icons.air_rounded),
    'APM': (label: 'Pressão', icon: Icons.compress_rounded),
  };

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    final center = LatLng(state.location.latitude, state.location.longitude);
    if (_lastLocationKey != state.location.storageKey) {
      _lastLocationKey = state.location.storageKey;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _mapController.move(center, 7.5);
      });
    }
    final base = AppConfig.bffUrl.replaceAll(RegExp(r'/+$'), '');
    final overlay =
        '$base/weather?endpoint=tile&layer=$_layer&z={z}&x={x}&y={y}';
    final dark = state.settings.darkMap;

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: 7.5,
              minZoom: 2,
              maxZoom: 18,
            ),
            children: [
              TileLayer(
                urlTemplate: dark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'com.eliasnunes.meteor',
                maxZoom: 19,
                maxNativeZoom: 18,
                panBuffer: 0,
                keepBuffer: 1,
              ),
              TileLayer(
                key: ValueKey('$_layer-$_opacity'),
                urlTemplate: overlay,
                userAgentPackageName: 'com.eliasnunes.meteor',
                tileProvider: NetworkTileProvider(),
                maxNativeZoom: 10,
                maxZoom: 12,
                panBuffer: 0,
                keepBuffer: 1,
                errorTileCallback: (_, _, _) {},
                tileBuilder: (_, tile, _) =>
                    Opacity(opacity: _opacity, child: tile),
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: center,
                    width: 28,
                    height: 28,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: const [
                          BoxShadow(blurRadius: 9, color: Colors.black45),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              RichAttributionWidget(
                showFlutterMapAttribution: false,
                attributions: [
                  TextSourceAttribution(
                    '© OpenStreetMap © CARTO',
                    onTap: () => launchUrl(
                      Uri.parse('https://www.openstreetmap.org/copyright'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
                  const TextSourceAttribution('Clima: OpenWeather'),
                ],
              ),
            ],
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    IconButton.filled(
                      tooltip: 'Voltar para a localidade',
                      onPressed: () => _mapController.move(center, 7.5),
                      icon: const Icon(Icons.location_searching_rounded),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Material(
                        color: Theme.of(context).colorScheme.surface
                            .withValues(alpha: .9),
                        borderRadius: BorderRadius.circular(18),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Mapa meteorológico',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              Text(
                                state.location.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      tooltip: 'Usar localização atual',
                      onPressed: () async {
                        await state.useCurrentLocation();
                        if (!context.mounted) return;
                        _mapController.move(
                          LatLng(
                            state.location.latitude,
                            state.location.longitude,
                          ),
                          8,
                        );
                      },
                      icon: const Icon(Icons.my_location_rounded),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 12,
            right: 12,
            bottom: 22,
            child: SafeArea(
              top: false,
              child: Material(
                color: Theme.of(context).colorScheme.surface
                    .withValues(alpha: .94),
                borderRadius: BorderRadius.circular(24),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _layers.entries
                              .map(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    avatar: Icon(entry.value.icon, size: 17),
                                    label: Text(entry.value.label),
                                    selected: _layer == entry.key,
                                    onSelected: (_) =>
                                        setState(() => _layer = entry.key),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.layers_outlined, size: 18),
                          Expanded(
                            child: Slider(
                              value: _opacity,
                              min: .25,
                              max: .9,
                              onChanged: (value) =>
                                  setState(() => _opacity = value),
                            ),
                          ),
                          Text('${(_opacity * 100).round()}%'),
                        ],
                      ),
                      _MapLegend(layer: _layer),
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
}

class _MapLegend extends StatelessWidget {
  const _MapLegend({required this.layer});
  final String layer;

  @override
  Widget build(BuildContext context) {
    final labels = switch (layer) {
      'PR0' => ('Fraca', 'Intensa'),
      'TA2' => ('Frio', 'Calor'),
      'WS10' => ('Calmo', 'Forte'),
      'APM' => ('Baixa', 'Alta'),
      _ => ('Poucas', 'Muitas'),
    };
    return Row(
      children: [
        Text(labels.$1, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(width: 8),
        const Expanded(
          child: SizedBox(
            height: 5,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.all(Radius.circular(8)),
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF54B8FF),
                    Color(0xFF6C55D9),
                    Color(0xFFE52E71),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(labels.$2, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}
