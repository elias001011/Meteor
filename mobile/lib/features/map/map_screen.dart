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
  String _layer = 'PR0';

  static const _layers = {
    'PR0': 'Chuva',
    'CL': 'Nuvens',
    'TA2': 'Temperatura',
    'WS10': 'Vento',
    'APM': 'Pressão',
  };

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    final center = LatLng(state.location.latitude, state.location.longitude);
    final bff = AppConfig.bffUrl.replaceAll(RegExp(r'/+$'), '');
    final weatherTiles =
        '$bff/weather?endpoint=tile&layer=$_layer&z={z}&x={x}&y={y}';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mapa meteorológico'),
        actions: [
          IconButton(
            tooltip: 'Centralizar',
            onPressed: state.useCurrentLocation,
            icon: const Icon(Icons.my_location_rounded),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            key: ValueKey('${center.latitude}:${center.longitude}'),
            options: MapOptions(initialCenter: center, initialZoom: 7.5),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.eliasnunes.meteor',
                maxZoom: 19,
              ),
              TileLayer(
                urlTemplate: weatherTiles,
                userAgentPackageName: 'com.eliasnunes.meteor',
                tileProvider: NetworkTileProvider(),
                errorTileCallback: (_, _, _) {},
                tileBuilder: (_, tile, _) => Opacity(opacity: .62, child: tile),
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: center,
                    width: 52,
                    height: 52,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: const [
                          BoxShadow(blurRadius: 12, color: Colors.black38),
                        ],
                      ),
                      child: const Icon(
                        Icons.location_on_rounded,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              RichAttributionWidget(
                showFlutterMapAttribution: false,
                attributions: [
                  TextSourceAttribution(
                    '© OpenStreetMap',
                    onTap: () => launchUrl(
                      Uri.parse('https://www.openstreetmap.org/copyright'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
                  const TextSourceAttribution(
                    'Dados meteorológicos: OpenWeather',
                  ),
                ],
              ),
            ],
          ),
          Positioned(
            left: 12,
            right: 12,
            top: 12,
            child: SafeArea(
              child: Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    children: _layers.entries
                        .map(
                          (entry) => Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ChoiceChip(
                              label: Text(entry.value),
                              selected: _layer == entry.key,
                              onSelected: (_) =>
                                  setState(() => _layer = entry.key),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            left: 14,
            bottom: 36,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.location_on_rounded,
                      size: 16,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 5),
                    Text(state.location.name),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
