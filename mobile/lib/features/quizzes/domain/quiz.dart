import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum QuizQuestionType { multipleChoice, trueFalse, fillBlank, verseCompletion }

QuizQuestionType quizQuestionTypeFromString(String value) => switch (value) {
      'multiple_choice' => QuizQuestionType.multipleChoice,
      'true_false' => QuizQuestionType.trueFalse,
      'fill_blank' => QuizQuestionType.fillBlank,
      'verse_completion' => QuizQuestionType.verseCompletion,
      _ => QuizQuestionType.multipleChoice,
    };

class QuizQuestion extends Equatable {
  final QuizQuestionType type;
  final String question;
  final List<String> options;
  final String correctAnswer;
  final int points;

  const QuizQuestion({
    required this.type,
    required this.question,
    this.options = const [],
    required this.correctAnswer,
    this.points = 10,
  });

  factory QuizQuestion.fromMap(Map<String, dynamic> map) => QuizQuestion(
        type: quizQuestionTypeFromString(map['type'] ?? 'multiple_choice'),
        question: map['question'] ?? '',
        options: List<String>.from(map['options'] ?? const []),
        correctAnswer: map['correctAnswer'] ?? '',
        points: map['points'] ?? 10,
      );

  @override
  List<Object?> get props => [question, correctAnswer];
}

class Quiz extends Equatable {
  final String id;
  final String title;
  final String category;
  final List<QuizQuestion> questions;
  final bool isActive;

  const Quiz({
    required this.id,
    required this.title,
    required this.category,
    required this.questions,
    this.isActive = true,
  });

  int get totalPoints => questions.fold(0, (sum, q) => sum + q.points);

  factory Quiz.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return Quiz(
      id: doc.id,
      title: d['title'] ?? '',
      category: d['category'] ?? '',
      questions: ((d['questions'] as List?) ?? [])
          .map((q) => QuizQuestion.fromMap(Map<String, dynamic>.from(q)))
          .toList(),
      isActive: d['isActive'] ?? true,
    );
  }

  @override
  List<Object?> get props => [id, title, category];
}

class LeaderboardEntry extends Equatable {
  final String uid;
  final int totalPoints;
  final int quizzesCompleted;

  const LeaderboardEntry({required this.uid, required this.totalPoints, required this.quizzesCompleted});

  factory LeaderboardEntry.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data()!;
    return LeaderboardEntry(
      uid: doc.id,
      totalPoints: d['totalPoints'] ?? 0,
      quizzesCompleted: d['quizzesCompleted'] ?? 0,
    );
  }

  @override
  List<Object?> get props => [uid, totalPoints];
}
