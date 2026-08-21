import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:st_paul_family/core/widgets/async_value_widget.dart';
import 'package:st_paul_family/features/quizzes/presentation/quiz_providers.dart';

class QuizzesScreen extends ConsumerWidget {
  const QuizzesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quizzesAsync = ref.watch(activeQuizzesProvider);

    return AsyncValueWidget(
      value: quizzesAsync,
      data: (quizzes) {
        if (quizzes.isEmpty) return const Center(child: Text('No quizzes available right now.'));

        return ListView.builder(
          itemCount: quizzes.length,
          itemBuilder: (context, index) {
            final quiz = quizzes[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: ListTile(
                leading: const Icon(Icons.quiz_outlined),
                title: Text(quiz.title),
                subtitle: Text('${quiz.category} • ${quiz.questions.length} questions • ${quiz.totalPoints} pts'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/quiz/${quiz.id}/play'),
              ),
            );
          },
        );
      },
    );
  }
}
