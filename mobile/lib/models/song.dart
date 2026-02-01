class Song {
  final String id;
  final String title;
  final String artist;
  final String filename;
  final DateTime uploadDate;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.filename,
    required this.uploadDate,
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    // print('Song JSON: $json');
    final id = (json['id'] ?? json['_id'] ?? '').toString();
    // print('Parsed song ID: "$id" (length: ${id.length})');
    return Song(
      id: id,
      title: (json['title'] ?? 'Untitled').toString(),
      artist: (json['artist'] ?? 'Unknown Artist').toString(),
      filename: (json['filename'] ?? '').toString(),
      uploadDate: json['uploadDate'] != null ? DateTime.parse(json['uploadDate'].toString()) : DateTime.now(),
    );
  }
}