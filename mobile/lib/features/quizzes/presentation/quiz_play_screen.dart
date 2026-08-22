import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/auth/presentation/auth_controller.dart';
import 'package:st_paul_family/features/quizzes/domain/quiz.dart';
import 'package:st_paul_family/features/quizzes/presentation/quiz_providers.dart';

class QuizPlayScreen extends ConsumerStatefulWidget {
  const QuizPlayScreen({required this.quizId, super.key});

  final String quizId;

  @override
  ConsumerState<QuizPlayScreen> createState() => _QuizPlayScreenState();
}

class _QuizPlayScreenState extends ConsumerState<QuizPlayScreen> {
  Quiz? _quiz;
  int _currentIndex = 0;
  final Map<int, String> _answers = {};
  bool _loading = true;
  bool _submitted = false;
  int _score = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final quiz = await ref.read(quizRepositoryProvider).fetchQuiz(widget.quizId);
    setState(() {
      _quiz = quiz;
      _loading = false;
    });
  }

  Future<void> _submit() async {
    final quiz = _quiz;
    if (quiz == null) return;

    int score = 0;
    for (var i = 0; i < quiz.questions.length; i++) {
      final q = quiz.questions[i];
      final given = _answers[i]?.trim().toLowerCase();
      if (given != null && given == q.correctAnswer.trim().toLowerCase()) {
        score += q.points;
      }
    }

    final uid = ref.read(currentUserProvider).valueOrNull?.uid;
    if (uid != null) {
      await ref.read(quizRepositoryProvider).submitAttempt(
            quizId: widget.quizId,
            uid: uid,
            score: score,
            answers: _answers.map((k, v) => MapEntry(k.toString(), v)),
          );
    }

    setState(() {
      _score = score;
      _submitted = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final quiz = _quiz;
    if (quiz == null) {
      return const Scaffold(body: Center(child: Text('Quiz not found.')));
    }

    if (_submitted) {
      return Scaffold(
        appBar: AppBar(title: Text(quiz.title)),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.emoji_events_outlined, size: 64),
              const SizedBox(height: 16),
              Text('You scored $_score / ${quiz.totalPoints}', style: Theme.of(context).textTheme.headlineSmall),
            ],
          ),
        ),
      );
    }

    final question = quiz.questions[_currentIndex];

    return Scaffold(
      appBar: AppBar(title: Text('${quiz.title} (${_currentIndex + 1}/${quiz.questions.length})')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(question.question, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 24),
            Expanded(child: _buildAnswerInput(question)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentIndex > 0)
                  TextButton(
                    onPressed: () => setState(() => _currentIndex -= 1),
                    child: const Text('Back'),
                  )
                else
                  const SizedBox.shrink(),
                FilledButton(
                  onPressed: () {
                    if (_currentIndex < quiz.questions.length - 1) {
                      setState(() => _currentIndex += 1);
                    } else {
                      _submit();
                    }
                  },
                  child: Text(_currentIndex < quiz.questions.length - 1 ? 'Next' : 'Finish'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnswerInput(QuizQuestion question) {
    switch (question.type) {
      case QuizQuestionType.multipleChoice:
      case QuizQuestionType.verseCompletion:
        return ListView(
          children: question.options.map((option) {
            return RadioListTile<String>(
              title: Text(option),
              value: option,
              groupValue: _answers[_currentIndex],
              onChanged: (v) => setState(() => _answers[_currentIndex] = v ?? ''),
            );
          }).toList(),
        );
      case QuizQuestionType.trueFalse:
        return Column(
          children: ['True', 'False'].map((option) {
            return RadioListTile<String>(
              title: Text(option),
              value: option,
              groupValue: _answers[_currentIndex],
              onChanged: (v) => setState(() => _answers[_currentIndex] = v ?? ''),
            );
          }).toList(),
        );
      case QuizQuestionType.fillBlank:
        return TextField(
          decoration: const InputDecoration(labelText: 'Your answer'),
          onChanged: (v) => _answers[_currentIndex] = v,
        );
    }
  }
}
