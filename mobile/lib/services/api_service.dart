import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/video.dart';
import '../models/song.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiService {
  static String get baseUrl {
     if (kIsWeb || Platform.isAndroid || Platform.isIOS) {
      return 'https://hellwatch-ffus.onrender.com';
    }
    return 'http://localhost:5000';
  }
  
  static Future<List<Video>> getVideos() async {
    // print('Fetching videos from: $baseUrl/videos');
    final response = await http.get(Uri.parse('$baseUrl/videos'));
    // print('Videos response status: ${response.statusCode}');
    // print('Videos response body: ${response.body}');
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Video.fromJson(json)).toList();
    }
    throw Exception('Failed to load videos');
  }
  
  static Future<List<Song>> getSongs() async {
    // print('Fetching songs from: $baseUrl/songs');
    final response = await http.get(Uri.parse('$baseUrl/songs'));
    // print('Songs response status: ${response.statusCode}');
    // print('Songs response body: ${response.body}');
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Song.fromJson(json)).toList();
    }
    throw Exception('Failed to load songs');
  }
  
  static String getVideoStreamUrl(String id) {
    // print('Video stream URL: $baseUrl/videos/stream/$id');
    return '$baseUrl/videos/stream/$id';
  }
  static String getSongStreamUrl(String id) {
    // print('Song ID received: "$id" (length: ${id.length})');
    // print('Song stream URL: $baseUrl/songs/stream/$id');
    return '$baseUrl/songs/stream/$id';
  }
  static String getThumbnailUrl(String id) => '$baseUrl/songs/$id/thumbnail';
  static String getVideoThumbnailUrl(String id) => '$baseUrl/videos/$id/thumbnail';
  
  static Future<void> trackVideoView(String videoId, double watchedPercentage) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/videos/$videoId/track-view'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'watchedPercentage': watchedPercentage}),
      );
    } catch (e) {
      throw Exception('Failed to track view: $e');
    }
  }
}