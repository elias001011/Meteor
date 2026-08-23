import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app_controller.dart';
import '../../core/app_config.dart';
import '../../domain/app_settings.dart';

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
                          Text(
                            'AMOLED usa preto real no aplicativo; fotos permanecem apenas no cartão principal do clima.',
                            style: Theme.of(context).textTheme.bodySmall,
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
                          title: 'Resumo diário às 07:00',
                          subtitle: 'Fuso horário da localidade selecionada.',
                          value: settings.notifications.dailySummary,
                          onChanged: (value) => _updateNotifications(
                            state,
                            settings,
                            settings.notifications.copyWith(
                              dailySummary: value,
                            ),
                          ),
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
                        const ListTile(
                          leading: Icon(Icons.bedtime_outlined),
                          title: Text('Silencioso das 22:00 às 07:00'),
                          subtitle: Text(
                            'Alertas severos oficiais são a exceção.',
                          ),
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
