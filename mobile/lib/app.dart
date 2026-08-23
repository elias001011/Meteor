import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'app_controller.dart';
import 'core/app_theme.dart';
import 'domain/app_settings.dart';
import 'features/shell/app_shell.dart';

class MeteorApp extends StatelessWidget {
  const MeteorApp({required this.controller, super.key});

  final AppController controller;

  @override
  Widget build(BuildContext context) => ChangeNotifierProvider.value(
    value: controller,
    child: Consumer<AppController>(
      builder: (context, state, _) {
        final selected = state.settings.themeMode;
        final amoled = selected == MeteorThemeMode.amoled;
        final accent = state.settings.accent.color;
        return MaterialApp(
          title: 'Meteor',
          debugShowCheckedModeBanner: false,
          locale: const Locale('pt', 'BR'),
          supportedLocales: const [Locale('pt', 'BR')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          theme: AppTheme.light(accent),
          darkTheme: amoled ? AppTheme.amoled(accent) : AppTheme.dark(accent),
          themeMode: switch (selected) {
            MeteorThemeMode.light => ThemeMode.light,
            MeteorThemeMode.dark || MeteorThemeMode.amoled => ThemeMode.dark,
            MeteorThemeMode.system => ThemeMode.system,
          },
          home: const AppShell(),
        );
      },
    ),
  );
}

extension on MeteorAccent {
  Color get color => switch (this) {
    MeteorAccent.indigo => const Color(0xFF536DFE),
    MeteorAccent.blue => const Color(0xFF1976D2),
    MeteorAccent.cyan => const Color(0xFF0097A7),
    MeteorAccent.teal => const Color(0xFF00897B),
    MeteorAccent.green => const Color(0xFF388E3C),
    MeteorAccent.amber => const Color(0xFFFFB300),
    MeteorAccent.orange => const Color(0xFFF57C00),
    MeteorAccent.rose => const Color(0xFFD81B60),
    MeteorAccent.purple => const Color(0xFF7E57C2),
  };
}
