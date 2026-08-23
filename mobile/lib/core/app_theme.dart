import 'package:flutter/material.dart';

abstract final class AppTheme {
  static const seed = Color(0xFF4767FF);

  static ThemeData light([ColorScheme? scheme]) =>
      _build(Brightness.light, scheme);

  static ThemeData dark([ColorScheme? scheme]) =>
      _build(Brightness.dark, scheme);

  static ThemeData amoled() {
    final base = _build(Brightness.dark);
    const blackScheme = ColorScheme.dark(
      primary: Color(0xFFB8C4FF),
      onPrimary: Color(0xFF102264),
      secondary: Color(0xFF62D4ED),
      surface: Colors.black,
      onSurface: Color(0xFFF3F3F7),
      surfaceContainer: Color(0xFF090909),
      surfaceContainerHigh: Color(0xFF121212),
      outlineVariant: Color(0xFF292929),
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

  static ThemeData _build(Brightness brightness, [ColorScheme? dynamicScheme]) {
    final scheme =
        dynamicScheme ??
        ColorScheme.fromSeed(seedColor: seed, brightness: brightness);
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
