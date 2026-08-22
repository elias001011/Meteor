import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_controller.dart';
import '../../domain/content_models.dart';

class AiScreen extends StatefulWidget {
  const AiScreen({super.key});

  @override
  State<AiScreen> createState() => _AiScreenState();
}

class _AiScreenState extends State<AiScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _send(AppController state) {
    final text = _input.text;
    if (text.trim().isEmpty) return;
    _input.clear();
    state.sendMessage(text);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    if (state.aiDraft != null && _input.text != state.aiDraft) {
      _input.text = state.aiDraft!;
      _input.selection = TextSelection.collapsed(offset: _input.text.length);
    }
    if (state.isSendingChat) _scrollToBottom();
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Meteor IA'),
            Text(
              'Clima, contexto e fontes',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Limpar conversa',
            onPressed: state.chat.isEmpty ? null : state.clearChat,
            icon: const Icon(Icons.delete_sweep_outlined),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(
              children: [
                Expanded(
                  child: state.chat.isEmpty
                      ? _AiWelcome(
                          onSuggestion: (value) =>
                              setState(() => _input.text = value),
                        )
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
                          itemCount:
                              state.chat.length + (state.isSendingChat ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == state.chat.length) {
                              return const _TypingBubble();
                            }
                            return _MessageBubble(message: state.chat[index]);
                          },
                        ),
                ),
                if (state.chatError != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      state.chatError!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _input,
                          enabled: !state.isSendingChat,
                          minLines: 1,
                          maxLines: 6,
                          textCapitalization: TextCapitalization.sentences,
                          onSubmitted: (_) => _send(state),
                          decoration: const InputDecoration(
                            hintText: 'Pergunte sobre o tempo, uma viagem ou notícia…',
                            prefixIcon: Icon(Icons.auto_awesome_rounded),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        tooltip: 'Enviar',
                        onPressed: state.isSendingChat
                            ? null
                            : () => _send(state),
                        icon: const Icon(Icons.arrow_upward_rounded),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AiWelcome extends StatelessWidget {
  const _AiWelcome({required this.onSuggestion});

  final ValueChanged<String> onSuggestion;

  @override
  Widget build(BuildContext context) {
    final suggestions = [
      'Preciso de guarda-chuva nas próximas horas?',
      'Resuma a previsão da semana e destaque os riscos.',
      'Qual o melhor horário para uma caminhada hoje?',
    ];
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 40),
        Icon(
          Icons.auto_awesome_rounded,
          size: 62,
          color: Theme.of(context).colorScheme.primary,
        ),
        const SizedBox(height: 18),
        Text(
          'Converse com a previsão',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'A IA recebe o clima atual da sua cidade e pode consultar fontes quando necessário. Confirme alertas críticos em fontes oficiais.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 28),
        ...suggestions.map(
          (suggestion) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: OutlinedButton.icon(
              onPressed: () => onSuggestion(suggestion),
              icon: const Icon(Icons.north_west_rounded),
              label: Align(
                alignment: Alignment.centerLeft,
                child: Text(suggestion),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final user = message.role == ChatRole.user;
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: user ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 680),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: user ? scheme.primaryContainer : scheme.surfaceContainerHigh,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(user ? 20 : 4),
            bottomRight: Radius.circular(user ? 4 : 20),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SelectableText(message.text),
            if (message.sources.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Fontes', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 5),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: message.sources
                    .map(
                      (source) => ActionChip(
                        avatar: const Icon(Icons.open_in_new_rounded, size: 15),
                        label: Text(
                          source.title,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onPressed: () => launchUrl(
                          Uri.parse(source.uri),
                          mode: LaunchMode.externalApplication,
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],
            if (!user && message.model != null) ...[
              const SizedBox(height: 8),
              Text(
                message.model!,
                style: Theme.of(context).textTheme.labelSmall
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) => const Align(
    alignment: Alignment.centerLeft,
    child: Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 10),
          Text('Analisando…'),
        ],
      ),
    ),
  );
}
