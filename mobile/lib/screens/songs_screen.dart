import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/song.dart';
import '../services/api_service.dart';

class SongsScreen extends StatefulWidget {
  const SongsScreen({super.key});

  @override
  State<SongsScreen> createState() => _SongsScreenState();
}

class _SongsScreenState extends State<SongsScreen> {
  List<Song> songs = [];
  bool isLoading = true;
  final AudioPlayer _audioPlayer = AudioPlayer();
  Song? _currentSong;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    _loadSongs();
    _audioPlayer.onPlayerStateChanged.listen((state) {
      setState(() {
        _isPlaying = state == PlayerState.playing;
      });
    });
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _loadSongs() async {
    try {
      final loadedSongs = await ApiService.getSongs();
      setState(() {
        songs = loadedSongs;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading songs: $e')),
      );
    }
  }

  Future<void> _playSong(Song song) async {
    if (_currentSong?.id == song.id && _isPlaying) {
      await _audioPlayer.pause();
    } else {
      final url = ApiService.getSongStreamUrl(song.id);
      print('Playing song URL: $url');
      if (song.id.isNotEmpty) {
        await _audioPlayer.play(UrlSource(url));
        setState(() => _currentSong = song);
      } else {
        print('Song ID is empty, cannot play');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        if (_currentSong != null) _buildMiniPlayer(),
        Expanded(
          child: ListView.builder(
            itemCount: songs.length,
            itemBuilder: (context, index) {
              final song = songs[index];
              final isCurrentSong = _currentSong?.id == song.id;
              
              return Card(
                color: isCurrentSong ? Colors.red[900] : Colors.grey[900],
                child: ListTile(
                  leading: CachedNetworkImage(
                    imageUrl: ApiService.getThumbnailUrl(song.id),
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const Icon(Icons.music_note),
                    errorWidget: (context, url, error) => const Icon(Icons.music_note),
                  ),
                  title: Text(
                    song.title,
                    style: const TextStyle(color: Colors.white),
                  ),
                  subtitle: Text(
                    song.artist,
                    style: const TextStyle(color: Colors.grey),
                  ),
                  trailing: Icon(
                    isCurrentSong && _isPlaying ? Icons.pause : Icons.play_arrow,
                    color: Colors.red,
                  ),
                  onTap: () => _playSong(song),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildMiniPlayer() {
    return Container(
      padding: const EdgeInsets.all(8.0),
      color: Colors.grey[800],
      child: Row(
        children: [
          CachedNetworkImage(
            imageUrl: ApiService.getThumbnailUrl(_currentSong!.id),
            width: 40,
            height: 40,
            fit: BoxFit.cover,
            placeholder: (context, url) => const Icon(Icons.music_note),
            errorWidget: (context, url, error) => const Icon(Icons.music_note),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _currentSong!.title,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _currentSong!.artist,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              _isPlaying ? Icons.pause : Icons.play_arrow,
              color: Colors.red,
            ),
            onPressed: () => _playSong(_currentSong!),
          ),
        ],
      ),
    );
  }
}