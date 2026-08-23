import 'weather_models.dart';

class NewsArticle {
  const NewsArticle({
    required this.title,
    required this.description,
    required this.url,
    required this.imageUrl,
    required this.publishedAt,
    required this.source,
    this.content = '',
  });

  factory NewsArticle.fromJson(Json json) {
    final source = json['source'] is Map
        ? Map<String, dynamic>.from(json['source'] as Map)
        : const <String, dynamic>{};
    return NewsArticle(
      title: json['title']?.toString() ?? 'Sem título',
      description: json['description']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      imageUrl: json['image']?.toString(),
      publishedAt:
          DateTime.tryParse(json['publishedAt']?.toString() ?? '') ??
          DateTime.now(),
      source: source['name']?.toString() ?? 'Fonte desconhecida',
    );
  }

  final String title;
  final String description;
  final String content;
  final String url;
  final String? imageUrl;
  final DateTime publishedAt;
  final String source;

  String get aiContext => [
    title,
    description,
    if (content.isNotEmpty) content,
    'Fonte: $source',
  ].join('\n');
}

class GroundingSource {
  const GroundingSource({required this.title, required this.uri});

  factory GroundingSource.fromJson(Json json) => GroundingSource(
    title: json['title']?.toString() ?? 'Fonte',
    uri: json['uri']?.toString() ?? '',
  );

  final String title;
  final String uri;
}

enum ChatRole { user, assistant }

class ChatMessage {
  const ChatMessage({
    required this.role,
    required this.text,
    required this.sentAt,
    this.sources = const [],
    this.model,
  });

  factory ChatMessage.fromJson(Json json) => ChatMessage(
    role: json['role'] == 'user' ? ChatRole.user : ChatRole.assistant,
    text: json['text']?.toString() ?? '',
    sentAt:
        DateTime.tryParse(json['sentAt']?.toString() ?? '') ?? DateTime.now(),
    sources: json['sources'] is List
        ? (json['sources'] as List)
              .whereType<Map>()
              .map(
                (item) =>
                    GroundingSource.fromJson(Map<String, dynamic>.from(item)),
              )
              .toList()
        : const [],
    model: json['model']?.toString(),
  );

  final ChatRole role;
  final String text;
  final DateTime sentAt;
  final List<GroundingSource> sources;
  final String? model;

  Json toJson() => {
    'role': role == ChatRole.user ? 'user' : 'model',
    'text': text,
    'sentAt': sentAt.toIso8601String(),
    'sources': sources
        .map((source) => {'title': source.title, 'uri': source.uri})
        .toList(),
    if (model != null) 'model': model,
  };

  Json toGeminiHistory() => {
    'role': role == ChatRole.user ? 'user' : 'model',
    'parts': [
      {'text': text},
    ],
  };
}
