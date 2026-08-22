import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:st_paul_family/features/quizzes/data/quiz_repository.dart';
import 'package:st_paul_family/features/quizzes/domain/quiz.dart';

final quizRepositoryProvider = Provider<QuizRepository>((ref) => QuizRepository());

final activeQuizzesProvider = StreamProvider<List<Quiz>>((ref) => ref.watch(quizRepositoryProvider).watchActiveQuizzes());

final leaderboardProvider = StreamProvider<List<LeaderboardEntry>>((ref) => ref.watch(quizRepositoryProvider).watchLeaderboard());
