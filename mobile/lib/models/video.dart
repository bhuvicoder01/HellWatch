class Video {
  final String id;
  final String title;
  final String description;
  final String filename;
  final int views;
  final DateTime uploadDate;

  Video({
    required this.id,
    required this.title,
    required this.description,
    required this.filename,
    required this.views,
    required this.uploadDate,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    print('Video JSON: $json');
    final id = (json['id'] ?? json['_id'] ?? '').toString();
    print('Parsed video ID: "$id" (length: ${id.length})');
    return Video(
      id: id,
      title: (json['title'] ?? 'Untitled').toString(),
      description: (json['description'] ?? '').toString(),
      filename: (json['filename'] ?? '').toString(),
      views: json['stats.views'] ?? 0,
      uploadDate: json['uploadDate'] != null ? DateTime.parse(json['uploadDate'].toString()) : DateTime.now(),
    );
  }
}