import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:st_paul_family/core/constants/firestore_paths.dart';
import 'package:st_paul_family/features/quizzes/domain/quiz.dart';

class QuizRepository {
  QuizRepository({FirebaseFirestore? firestore}) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _quizzes => _firestore.collection(FirestorePaths.quizzes);
  CollectionReference<Map<String, dynamic>> get _leaderboard => _firestore.collection(FirestorePaths.leaderboard);

  Stream<List<Quiz>> watchActiveQuizzes() {
    return _quizzes.where('isActive', isEqualTo: true).snapshots().map(
          (s) => s.docs.map(Quiz.fromFirestore).toList(),
        );
  }

  Future<Quiz?> fetchQuiz(String quizId) async {
    final doc = await _quizzes.doc(quizId).get();
    return doc.exists ? Quiz.fromFirestore(doc) : null;
  }

  /// Submits a completed attempt. The `onQuizAttemptWritten` Cloud Function
  /// then updates the shared `leaderboard/{uid}` doc from this write.
  Future<void> submitAttempt({
    required String quizId,
    required String uid,
    required int score,
    required Map<String, String> answers,
  }) {
    return _quizzes.doc(quizId).collection(FirestorePaths.attemptsSubcollection).doc(uid).set({
      'score': score,
      'answers': answers,
      'completedAt': Timestamp.now(),
    });
  }

  Future<bool> hasAttempted(String quizId, String uid) async {
    final doc = await _quizzes.doc(quizId).collection(FirestorePaths.attemptsSubcollection).doc(uid).get();
    return doc.exists;
  }

  Stream<List<LeaderboardEntry>> watchLeaderboard({int limit = 50}) {
    return _leaderboard.orderBy('totalPoints', descending: true).limit(limit).snapshots().map(
          (s) => s.docs.map(LeaderboardEntry.fromFirestore).toList(),
        );
  }
}
