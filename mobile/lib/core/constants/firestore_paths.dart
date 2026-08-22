/// Single source of truth for Firestore collection names, so repositories
/// never hardcode strings that could drift from docs/DATABASE_SCHEMA.md.
class FirestorePaths {
  FirestorePaths._();

  static const users = 'users';
  static const meetings = 'meetings';
  static const attendance = 'attendance';
  static const followUps = 'followUps';
  static const notifications = 'notifications';
  static const sermons = 'sermons';
  static const devotionals = 'devotionals';
  static const quizzes = 'quizzes';
  static const leaderboard = 'leaderboard';
  static const activities = 'activities';
  static const news = 'news';
  static const library = 'library';
  static const reportsCache = 'reportsCache';

  static const favoritesSubcollection = 'favorites';
  static const attemptsSubcollection = 'attempts';
  static const registrationsSubcollection = 'registrations';
}
