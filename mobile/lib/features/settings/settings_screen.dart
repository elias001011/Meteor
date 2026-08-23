import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app_controller.dart';
import '../../core/app_config.dart';
import '../../domain/app_settings.dart';

extension on MeteorAccent {
  String get label => switch (this) {
    MeteorAccent.indigo => 'Índigo',
    MeteorAccent.blue => 'Azul',
    MeteorAccent.cyan => 'Ciano',
    MeteorAccent.teal => 'Verde-azulado',
    MeteorAccent.green => 'Verde',
    MeteorAccent.amber => 'Âmbar',
    MeteorAccent.orange => 'Laranja',
    MeteorAccent.rose => 'Rosa',
    MeteorAccent.purple => 'Roxo',
  };

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

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    final settings = state.settings;
    return Scaffold(
      appBar: AppBar(title: const Text('Ajustes')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _SettingsHeader('Aparência'),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children:
                                const {
                                  MeteorThemeMode.system: (
                                    Icons.brightness_auto,
                                    'Sistema',
                                  ),
                                  MeteorThemeMode.light: (
                                    Icons.light_mode_outlined,
                                    'Claro',
                                  ),
                                  MeteorThemeMode.dark: (
                                    Icons.dark_mode_outlined,
                                    'Escuro',
                                  ),
                                  MeteorThemeMode.amoled: (
                                    Icons.contrast_rounded,
                                    'AMOLED',
                                  ),
                                }.entries.map((entry) {
                                  return ChoiceChip(
                                    avatar: Icon(entry.value.$1, size: 18),
                                    label: Text(entry.value.$2),
                                    selected: settings.themeMode == entry.key,
                                    onSelected: (_) => state.updateSettings(
                                      settings.copyWith(themeMode: entry.key),
                                    ),
                                  );
                                }).toList(),
                          ),
                          const SizedBox(height: 10),
                          SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            secondary: const Icon(Icons.map_outlined),
                            title: const Text('Mapa escuro'),
                            subtitle: const Text(
                              'Afeta somente o mapa meteorológico. Desligado, ele permanece claro em qualquer tema.',
                            ),
                            value: settings.darkMap,
                            onChanged: (value) => state.updateSettings(
                              settings.copyWith(darkMap: value),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'AMOLED usa preto real no aplicativo; fotos permanecem apenas no cartão principal do clima.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 18),
                          Text(
                            'Cor do Meteor',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Escolha uma paleta Material para botões, gráficos e destaques.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: MeteorAccent.values.map((accent) {
                              final selected = settings.accent == accent;
                              return Semantics(
                                button: true,
                                selected: selected,
                                label: accent.label,
                                child: InkWell(
                                  customBorder: const CircleBorder(),
                                  onTap: () => state.updateSettings(
                                    settings.copyWith(accent: accent),
                                  ),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 180),
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: accent.color,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: selected
                                            ? Theme.of(context)
                                                  .colorScheme
                                                  .onSurface
                                            : Colors.transparent,
                                        width: 3,
                                      ),
                                    ),
                                    child: selected
                                        ? const Icon(
                                            Icons.check_rounded,
                                            color: Colors.white,
                                          )
                                        : null,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  const _SettingsHeader('Notificações no Android'),
                  Card(
                    child: Column(
                      children: [
                        if (!AppConfig.firebaseEnabled)
                          const ListTile(
                            leading: Icon(Icons.info_outline_rounded),
                            title: Text(
                              'Push ainda não configurado nesta instalação',
                            ),
                            subtitle: Text(
                              'O app continua totalmente funcional. Ative o Firebase na compilação oficial.',
                            ),
                          )
                        else
                          ListTile(
                            leading: Icon(
                              settings.pushEnabled
                                  ? Icons.notifications_active_rounded
                                  : Icons.notifications_outlined,
                            ),
                            title: Text(
                              settings.pushEnabled
                                  ? 'Notificações ativas'
                                  : 'Notificações desativadas',
                            ),
                            subtitle: Text(
                              settings.pushEnabled
                                  ? 'Esta instalação está registrada individualmente.'
                                  : 'A permissão só será pedida após seu toque.',
                            ),
                            trailing: settings.pushEnabled
                                ? OutlinedButton(
                                    onPressed: state.pushBusy
                                        ? null
                                        : state.disablePush,
                                    child: const Text('Desativar'),
                                  )
                                : FilledButton(
                                    onPressed: state.pushBusy
                                        ? null
                                        : () async {
                                            final enabled = await state
                                                .enablePush();
                                            if (!context.mounted) return;
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  enabled
                                                      ? 'Notificações ativadas.'
                                                      : state.pushError ?? 'Não foi possível ativar.',
                                                ),
                                              ),
                                            );
                                          },
                                    child: const Text('Ativar'),
                                  ),
                          ),
                        if (state.pushBusy)
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: LinearProgressIndicator(),
                          ),
                        if (state.pushError != null)
                          ListTile(
                            leading: Icon(
                              Icons.error_outline,
                              color: Theme.of(context).colorScheme.error,
                            ),
                            title: Text(
                              state.pushError!,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ),
                        _NotificationSwitch(
                          title: 'Alertas severos oficiais',
                          subtitle:
                              'Podem furar o horário silencioso por segurança.',
                          value: settings.notifications.severeAlerts,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(
                              severeAlerts: value,
                            ),
                          ),
                        ),
                        _NotificationSwitch(
                          title: 'Chuva iminente',
                          subtitle:
                              'Mudanças relevantes para a localidade salva.',
                          value: settings.notifications.rainSoon,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(rainSoon: value),
                          ),
                        ),
                        _NotificationSwitch(
                          title: 'Resumo diário',
                          subtitle: 'Usa uma previsão nova no servidor, no fuso do aparelho.',
                          value: settings.notifications.dailySummary,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(
                              dailySummary: value,
                            ),
                          ),
                        ),
                        ListTile(
                          enabled: settings.notifications.dailySummary,
                          leading: const Icon(Icons.schedule_rounded),
                          title: const Text('Horário do resumo'),
                          subtitle: Text(
                            '${settings.notifications.dailySummaryHour.toString().padLeft(2, '0')}:00',
                          ),
                          trailing: const Icon(Icons.chevron_right_rounded),
                          onTap: () async {
                            final hour = await _pickHour(
                              context,
                              settings.notifications.dailySummaryHour,
                              'Horário do resumo',
                            );
                            if (hour == null) return;
                            _updateNotifications(
                              state,
                              settings,
                              settings.notifications.copyWith(
                                dailySummaryHour: hour,
                              ),
                            );
                          },
                        ),
                        _NotificationSwitch(
                          title: 'Temperaturas extremas',
                          value: settings.notifications.temperature,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(temperature: value),
                          ),
                        ),
                        _NotificationSwitch(
                          title: 'Índice UV alto',
                          value: settings.notifications.uv,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(uv: value),
                          ),
                        ),
                        _NotificationSwitch(
                          title: 'Vento forte',
                          value: settings.notifications.wind,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(wind: value),
                          ),
                        ),
                        SwitchListTile(
                          secondary: const Icon(Icons.bedtime_outlined),
                          title: const Text('Horário silencioso'),
                          subtitle: const Text(
                            'Alertas oficiais críticos continuam sendo entregues.',
                          ),
                          value: settings.notifications.quietHoursEnabled,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(
                              quietHoursEnabled: value,
                            ),
                          ),
                        ),
                        if (settings.notifications.quietHoursEnabled)
                          ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            leading: const Icon(Icons.timelapse_rounded),
                            title: const Text('Período silencioso'),
                            subtitle: Text(
                              '${settings.notifications.quietStartHour.toString().padLeft(2, '0')}:00 – '
                              '${settings.notifications.quietEndHour.toString().padLeft(2, '0')}:00',
                            ),
                            trailing: const Icon(Icons.chevron_right_rounded),
                            onTap: () =>
                                _pickQuietHours(context, state, settings),
                          ),
                        ExpansionTile(
                          leading: const Icon(Icons.tune_rounded),
                          title: const Text('Limites personalizados'),
                          subtitle: const Text(
                            'Temperatura, UV e vento para alertas opcionais.',
                          ),
                          childrenPadding: const EdgeInsets.fromLTRB(
                            16,
                            0,
                            16,
                            12,
                          ),
                          children: [
                            _ThresholdSlider(
                              label: 'Frio',
                              value: settings.notifications.coldThresholdC,
                              min: -10,
                              max: 15,
                              unit: '°C',
                              onChanged: (value) => _updateNotifications(
                                state,
                                settings,
                                settings.notifications.copyWith(
                                  coldThresholdC: value,
                                ),
                              ),
                            ),
                            _ThresholdSlider(
                              label: 'Calor',
                              value: settings.notifications.heatThresholdC,
                              min: 26,
                              max: 45,
                              unit: '°C',
                              onChanged: (value) => _updateNotifications(
                                state,
                                settings,
                                settings.notifications.copyWith(
                                  heatThresholdC: value,
                                ),
                              ),
                            ),
                            _ThresholdSlider(
                              label: 'Índice UV',
                              value: settings.notifications.uvThreshold,
                              min: 3,
                              max: 12,
                              unit: '',
                              onChanged: (value) => _updateNotifications(
                                state,
                                settings,
                                settings.notifications.copyWith(
                                  uvThreshold: value,
                                ),
                              ),
                            ),
                            _ThresholdSlider(
                              label: 'Vento',
                              value: settings.notifications.windThresholdKmh,
                              min: 30,
                              max: 120,
                              unit: ' km/h',
                              onChanged: (value) => _updateNotifications(
                                state,
                                settings,
                                settings.notifications.copyWith(
                                  windThresholdKmh: value,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  const _SettingsHeader('Meteor IA'),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            initialValue: settings.aiInstructions,
                            minLines: 2,
                            maxLines: 5,
                            maxLength: 500,
                            decoration: const InputDecoration(
                              labelText: 'Preferências de resposta',
                              hintText:
                                  'Ex.: seja breve e use linguagem simples',
                            ),
                            onChanged: (value) => state.updateSettings(
                              settings.copyWith(aiInstructions: value.trim()),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Essas preferências e o contexto meteorológico são enviados ao BFF; nenhuma chave do Gemini fica no aparelho.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 10),
                          OutlinedButton.icon(
                            onPressed: state.clearChat,
                            icon: const Icon(Icons.delete_sweep_outlined),
                            label: const Text('Limpar conversa da IA'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  const _SettingsHeader('Dados e privacidade'),
                  Card(
                    child: Column(
                      children: [
                        const ListTile(
                          leading: Icon(Icons.location_on_outlined),
                          title: Text('Localização somente em primeiro plano'),
                          subtitle: Text(
                            'O Meteor não solicita acesso à localização em segundo plano.',
                          ),
                        ),
                        ListTile(
                          leading: const Icon(Icons.cloud_outlined),
                          title: const Text('Servidor BFF'),
                          subtitle: Text(AppConfig.bffUrl),
                        ),
                        ListTile(
                          leading: const Icon(Icons.cleaning_services_outlined),
                          title: const Text('Limpar cache e histórico'),
                          subtitle: const Text(
                            'Remove previsões, notícias e conversa salvas neste aparelho.',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => _confirmClear(context, state),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  const _SettingsHeader('Sobre'),
                  const Card(
                    child: ListTile(
                      leading: Icon(Icons.storm_rounded),
                      title: Text('Meteor 1.0.0'),
                      subtitle: Text(
                        'Clima, contexto e alertas. Feito com Flutter e Material 3.',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmClear(BuildContext context, AppController state) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Limpar dados locais?'),
        content: const Text(
          'A cidade e o tema serão mantidos. Cache, notícias e conversa serão apagados.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Limpar'),
          ),
        ],
      ),
    );
    if (confirmed == true) await state.clearLocalData();
  }

  Future<int?> _pickHour(
    BuildContext context,
    int initialHour,
    String helpText,
  ) async {
    final selected = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: initialHour, minute: 0),
      helpText: helpText,
    );
    return selected?.hour;
  }

  Future<void> _pickQuietHours(
    BuildContext context,
    AppController state,
    AppSettings settings,
  ) async {
    final start = await _pickHour(
      context,
      settings.notifications.quietStartHour,
      'Início do silêncio',
    );
    if (start == null || !context.mounted) return;
    final end = await _pickHour(
      context,
      settings.notifications.quietEndHour,
      'Fim do silêncio',
    );
    if (end == null) return;
    _updateNotifications(
      state,
      settings,
      settings.notifications.copyWith(quietStartHour: start, quietEndHour: end),
    );
  }

  void _updateNotifications(
    AppController state,
    AppSettings settings,
    NotificationPreferences value,
  ) {
    state.updateSettings(settings.copyWith(notifications: value));
  }
}

class _SettingsHeader extends StatelessWidget {
  const _SettingsHeader(this.title);

  final String title;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 6, 4, 10),
    child: Text(
      title,
      style: Theme.of(context).textTheme.titleMedium
          ?.copyWith(color: Theme.of(context).colorScheme.primary),
    ),
  );
}

class _NotificationSwitch extends StatelessWidget {
  const _NotificationSwitch({
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => SwitchListTile(
    title: Text(title),
    subtitle: subtitle == null ? null : Text(subtitle!),
    value: value,
    onChanged: onChanged,
  );
}

class _ThresholdSlider extends StatelessWidget {
  const _ThresholdSlider({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.unit,
    required this.onChanged,
  });

  final String label;
  final double value;
  final double min;
  final double max;
  final String unit;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('$label: ${value.round()}$unit'),
      Slider(
        value: value.clamp(min, max),
        min: min,
        max: max,
        divisions: (max - min).round(),
        label: '${value.round()}$unit',
        onChanged: onChanged,
      ),
    ],
  );
}
