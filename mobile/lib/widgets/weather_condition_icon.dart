import 'package:flutter/material.dart';

class WeatherConditionIcon extends StatelessWidget {
  const WeatherConditionIcon({
    required this.condition,
    this.size = 28,
    this.color,
    super.key,
  });

  final String condition;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final value = condition.toLowerCase();
    final symbol = _symbol(value);
    final resolvedColor = color ?? _color(context, value);
    return Icon(symbol, size: size, color: resolvedColor);
  }

  IconData _symbol(String value) {
    if (_has(value, ['tempest', 'trovo', 'thunder', '⛈'])) {
      return Icons.thunderstorm_rounded;
    }
    if (_has(value, ['neve', 'snow', '❄'])) return Icons.ac_unit_rounded;
    if (_has(value, ['nevo', 'névo', 'fog', 'mist', '🌫'])) {
      return Icons.foggy;
    }
    if (_has(value, ['chuva', 'chuv', 'rain', 'garoa', '🌧', '🌦'])) {
      return Icons.water_drop_rounded;
    }
    if (_has(value, ['nublado', 'cloud', '☁', '🌥'])) {
      return Icons.cloud_rounded;
    }
    if (_has(value, ['noite', 'moon', 'lua', '🌙'])) {
      return Icons.nightlight_round;
    }
    if (_has(value, ['parcial', 'poucas nuvens', '🌤'])) {
      return Icons.wb_cloudy_rounded;
    }
    return Icons.wb_sunny_rounded;
  }

  Color _color(BuildContext context, String value) {
    if (_has(value, ['tempest', 'trovo', 'thunder'])) {
      return const Color(0xFF8E7CFF);
    }
    if (_has(value, ['chuva', 'chuv', 'rain', 'garoa'])) {
      return const Color(0xFF48A9FF);
    }
    if (_has(value, ['sol', 'limpo', 'clear', '☀', '🌤'])) {
      return const Color(0xFFFFC43D);
    }
    return Theme.of(context).colorScheme.onSurfaceVariant;
  }

  bool _has(String value, List<String> terms) =>
      terms.any((term) => value.contains(term));
}
