import 'package:flutter/material.dart';

abstract final class AppTheme {
  static ThemeData light(Color seed) => _build(Brightness.light, seed);

  static ThemeData dark(Color seed) => _build(Brightness.dark, seed);

  static ThemeData amoled(Color seed) {
    final base = _build(Brightness.dark, seed);
    final blackScheme = base.colorScheme.copyWith(
      surface: Colors.black,
      onSurface: const Color(0xFFF3F3F7),
      surfaceContainer: const Color(0xFF090909),
      surfaceContainerHigh: const Color(0xFF121212),
      outlineVariant: const Color(0xFF292929),
    );
    return base.copyWith(
      scaffoldBackgroundColor: Colors.black,
      colorScheme: blackScheme,
      cardTheme: base.cardTheme.copyWith(color: const Color(0xFF090909)),
      navigationBarTheme: base.navigationBarTheme.copyWith(
        backgroundColor: Colors.black,
      ),
      navigationRailTheme: base.navigationRailTheme.copyWith(
        backgroundColor: Colors.black,
      ),
    );
  }

  static ThemeData _build(Brightness brightness, Color seed) {
    final scheme = ColorScheme.fromSeed(
      seedColor: seed,
      brightness: brightness,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: scheme.surface,
      visualDensity: VisualDensity.standard,
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: scheme.surfaceContainerLow,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainerHigh,
        border: OutlineInputBorder(
          borderSide: BorderSide.none,
          borderRadius: BorderRadius.circular(18),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 68,
        elevation: 0,
        backgroundColor: scheme.surfaceContainer,
        indicatorShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
