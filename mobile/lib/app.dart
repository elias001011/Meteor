import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:dynamic_color/dynamic_color.dart';

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
        return DynamicColorBuilder(
          builder: (lightDynamic, darkDynamic) => MaterialApp(
            title: 'Meteor',
            debugShowCheckedModeBanner: false,
            locale: const Locale('pt', 'BR'),
            supportedLocales: const [Locale('pt', 'BR')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            theme: AppTheme.light(
              state.settings.dynamicColor ? lightDynamic : null,
            ),
            darkTheme: amoled
                ? AppTheme.amoled()
                : AppTheme.dark(
                    state.settings.dynamicColor ? darkDynamic : null,
                  ),
            themeMode: switch (selected) {
              MeteorThemeMode.light => ThemeMode.light,
              MeteorThemeMode.dark || MeteorThemeMode.amoled => ThemeMode.dark,
              MeteorThemeMode.system => ThemeMode.system,
            },
            home: const AppShell(),
          ),
        );
      },
    ),
  );
}
