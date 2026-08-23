import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app_controller.dart';
import '../ai/ai_screen.dart';
import '../home/home_screen.dart';
import '../map/map_screen.dart';
import '../news/news_screen.dart';
import '../settings/settings_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  StreamSubscription<String>? _routeSubscription;

  static const _destinations = [
    NavigationDestination(
      icon: Icon(Icons.wb_sunny_outlined),
      selectedIcon: Icon(Icons.wb_sunny_rounded),
      label: 'Hoje',
    ),
    NavigationDestination(
      icon: Icon(Icons.map_outlined),
      selectedIcon: Icon(Icons.map_rounded),
      label: 'Mapa',
    ),
    NavigationDestination(
      icon: Icon(Icons.auto_awesome_outlined),
      selectedIcon: Icon(Icons.auto_awesome_rounded),
      label: 'IA',
    ),
    NavigationDestination(
      icon: Icon(Icons.newspaper_outlined),
      selectedIcon: Icon(Icons.newspaper_rounded),
      label: 'Notícias',
    ),
    NavigationDestination(
      icon: Icon(Icons.tune_outlined),
      selectedIcon: Icon(Icons.tune_rounded),
      label: 'Ajustes',
    ),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _routeSubscription ??= context
        .read<AppController>()
        .notifications
        .openedRoutes
        .listen((route) {
          if (!mounted) return;
          final next = switch (route) {
            'map' => 1,
            'ai' => 2,
            'news' => 3,
            'settings' => 4,
            _ => 0,
          };
          setState(() => _index = next);
        });
    final pendingRoute = context
        .read<AppController>()
        .notifications
        .takePendingRoute();
    if (pendingRoute != null) {
      _index = switch (pendingRoute) {
        'map' => 1,
        'ai' => 2,
        'news' => 3,
        'settings' => 4,
        _ => 0,
      };
    }
  }

  @override
  void dispose() {
    _routeSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      const HomeScreen(),
      const MapScreen(),
      const AiScreen(),
      const NewsScreen(),
      const SettingsScreen(),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        if (!wide) {
          return Scaffold(
            body: IndexedStack(index: _index, children: pages),
            bottomNavigationBar: NavigationBar(
              selectedIndex: _index,
              destinations: _destinations,
              onDestinationSelected: (value) => setState(() => _index = value),
            ),
          );
        }
        return Scaffold(
          body: Row(
            children: [
              SafeArea(
                child: NavigationRail(
                  selectedIndex: _index,
                  labelType: NavigationRailLabelType.all,
                  leading: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: _MeteorMark(),
                  ),
                  destinations: _destinations
                      .map(
                        (item) => NavigationRailDestination(
                          icon: item.icon,
                          selectedIcon: item.selectedIcon,
                          label: Text(item.label),
                        ),
                      )
                      .toList(),
                  onDestinationSelected: (value) =>
                      setState(() => _index = value),
                ),
              ),
              const VerticalDivider(width: 1),
              Expanded(
                child: IndexedStack(index: _index, children: pages),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MeteorMark extends StatelessWidget {
  const _MeteorMark();

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Meteor',
    child: Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(
        Icons.storm_rounded,
        color: Theme.of(context).colorScheme.onPrimaryContainer,
      ),
    ),
  );
}
