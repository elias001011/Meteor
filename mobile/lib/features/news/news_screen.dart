import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_controller.dart';
import '../../domain/content_models.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({required this.onAskAi, super.key});

  final VoidCallback onAskAi;

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  String _category = 'general';
  final _search = TextEditingController();

  static const _categories = {
    'general': 'Destaques',
    'world': 'Mundo',
    'nation': 'Brasil',
    'technology': 'Tecnologia',
    'science': 'Ciência',
    'health': 'Saúde',
    'business': 'Negócios',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppController>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notícias'),
        actions: [
          IconButton(
            tooltip: 'Atualizar',
            onPressed: () => state.loadNews(category: _category),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => state.loadNews(category: _category),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1000),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: Column(
                      children: [
                        TextField(
                          controller: _search,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (value) => state.loadNews(query: value),
                          decoration: InputDecoration(
                            hintText: 'Pesquisar notícias',
                            prefixIcon: const Icon(Icons.search_rounded),
                            suffixIcon: IconButton(
                              onPressed: () =>
                                  state.loadNews(query: _search.text),
                              icon: const Icon(Icons.arrow_forward_rounded),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: _categories.entries
                                .map(
                                  (entry) => Padding(
                                    padding: const EdgeInsets.only(right: 7),
                                    child: ChoiceChip(
                                      label: Text(entry.value),
                                      selected: _category == entry.key,
                                      onSelected: (_) {
                                        setState(() => _category = entry.key);
                                        _search.clear();
                                        state.loadNews(category: entry.key);
                                      },
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                        if (state.newsState == LoadState.loading)
                          const Padding(
                            padding: EdgeInsets.only(top: 10),
                            child: LinearProgressIndicator(),
                          ),
                        if (state.newsError != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(
                              state.newsError!,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            if (state.news.isEmpty && state.newsState != LoadState.loading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: Text('Nenhuma notícia encontrada.')),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                sliver: SliverLayoutBuilder(
                  builder: (context, constraints) {
                    final columns = constraints.crossAxisExtent >= 900
                        ? 3
                        : constraints.crossAxisExtent >= 600
                        ? 2
                        : 1;
                    return SliverGrid.builder(
                      itemCount: state.news.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        mainAxisExtent: 390,
                      ),
                      itemBuilder: (context, index) => _ArticleCard(
                        article: state.news[index],
                        onAskAi: () {
                          state.askAboutNews(state.news[index]);
                          widget.onAskAi();
                        },
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ArticleCard extends StatelessWidget {
  const _ArticleCard({required this.article, required this.onAskAi});

  final NewsArticle article;
  final VoidCallback onAskAi;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: article.url.isEmpty
          ? null
          : () => launchUrl(
              Uri.parse(article.url),
              mode: LaunchMode.externalApplication,
            ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 165,
            child: article.imageUrl?.isNotEmpty == true
                ? CachedNetworkImage(
                    imageUrl: article.imageUrl!,
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) => const _NewsImageFallback(),
                  )
                : const _NewsImageFallback(),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${article.source} • ${DateFormat('dd MMM, HH:mm', 'pt_BR').format(article.publishedAt)}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    article.title,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 7),
                  Expanded(
                    child: Text(
                      article.description,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: onAskAi,
                      icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                      label: const Text('Analisar com IA'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _NewsImageFallback extends StatelessWidget {
  const _NewsImageFallback();

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: Theme.of(context).colorScheme.secondaryContainer,
    child: Center(
      child: Icon(
        Icons.newspaper_rounded,
        size: 48,
        color: Theme.of(context).colorScheme.onSecondaryContainer,
      ),
    ),
  );
}
