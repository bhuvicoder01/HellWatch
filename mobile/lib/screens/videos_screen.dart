import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/video.dart';
import '../services/api_service.dart';
import '../widgets/custom_video_player.dart';

class VideosScreen extends StatefulWidget {
  const VideosScreen({super.key});

  @override
  State<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends State<VideosScreen> {
  List<Video> videos = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadVideos();
  }

  Future<void> _loadVideos() async {
    try {
      final loadedVideos = await ApiService.getVideos();
      if (mounted) {
        setState(() {
          videos = loadedVideos;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading videos: $e')),
        );
      }
    }
  }

  void _playVideo(Video video) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoPlayerScreen(video: video),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SafeArea(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            for (var i = 0; i < videos.length; i++)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 2.0),
                child: Card(
                  clipBehavior: Clip.antiAlias,
                  elevation: 4.0,
                  color: const Color.fromARGB(171, 24, 23, 23),
                  child: InkWell(
                    onTap: () {
                      if (videos.isNotEmpty) {
                        // Future.delayed(const Duration(milliseconds: 500), () {
                        //   _playVideo(videos[i]);
                        // });
                        _playVideo(videos[i]);
                      }
                    },
                    splashColor: const Color.fromARGB(104, 102, 7, 235),
                    highlightColor: const Color.fromARGB(180, 105, 104, 104),
                    child: Container(
                      width: 150,
                      height: 150,
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Stack(
                            alignment: Alignment.center,
                            children: [
                              Image.network(
                                ApiService.getVideoThumbnailUrl(videos[i].id),
                                // width: 100,
                                // height: 60,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 120,
                                    height: 60,
                                    color: Colors.grey[300],
                                    child: const Icon(Icons.video_library,
                                        size: 30),
                                  );
                                },
                              ),
                              const Icon(Icons.play_circle,
                                  color: Colors.red, size: 30),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            videos[i].title,
                            style: const TextStyle(
                                fontSize: 12, color: Colors.white),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${videos[i].views} views',
                            style: const TextStyle(
                                color: Colors.grey, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class VideoPlayerScreen extends StatefulWidget {
  final Video video;

  const VideoPlayerScreen({super.key, required this.video});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(widget.video.title, style: const TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Expanded(
            child: CustomVideoPlayer(video: widget.video),
          ),
          Container(
            color: Colors.grey[900],
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.video.title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  '${widget.video.views} views • ${widget.video.uploadDate.toIso8601String().split('T').first}',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 12),
                Text(
                  widget.video.description,
                  style: const TextStyle(color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
