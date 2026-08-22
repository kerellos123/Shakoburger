/// A small built-in rotation of verses, keyed by day-of-year, so the home
/// screen always has something to show without needing a dedicated backend
/// collection. Replace with a `verses` Firestore collection if editorial
/// control over the rotation is needed later.
class VerseOfTheDay {
  VerseOfTheDay._();

  static const List<(String, String)> _verses = [
    ('For I know the plans I have for you, declares the Lord.', 'Jeremiah 29:11'),
    ('I can do all things through Christ who strengthens me.', 'Philippians 4:13'),
    ('The Lord is my shepherd; I shall not want.', 'Psalm 23:1'),
    ('Trust in the Lord with all your heart.', 'Proverbs 3:5'),
    ('Be strong and courageous. Do not be afraid.', 'Joshua 1:9'),
    ('God is our refuge and strength, an ever-present help in trouble.', 'Psalm 46:1'),
    ('Come to me, all who labor and are heavy laden, and I will give you rest.', 'Matthew 11:28'),
  ];

  static (String text, String reference) today() {
    final dayOfYear = int.parse(DateTime.now().toIso8601String().substring(5, 7)) * 31 + DateTime.now().day;
    return _verses[dayOfYear % _verses.length];
  }
}
