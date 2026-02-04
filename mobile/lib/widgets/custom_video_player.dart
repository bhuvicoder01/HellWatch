import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import '../services/api_service.dart';
import '../models/video.dart';

class CustomVideoPlayer extends StatefulWidget {
  final Video video;

  const CustomVideoPlayer({super.key, required this.video});

  @override
  State<CustomVideoPlayer> createState() => _CustomVideoPlayerState();
}

class _CustomVideoPlayerState extends State<CustomVideoPlayer> {
  late VideoPlayerController _controller;
  bool _showControls = true;
  bool _isBuffering = false;
  String _quality = 'original';
  bool _showQualityMenu = false;
  bool _isFullScreen = false;
  bool _viewTracked = false;
  bool _isChangingQuality = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  void _initializePlayer() {
    _controller = VideoPlayerController.networkUrl(
      Uri.parse('${ApiService.baseUrl}/videos/stream/${widget.video.id}?quality=$_quality'),
    )..initialize().then((_) {
        if (mounted) {
          setState(() {});
          _controller.play();
          _hideControlsAfterDelay();
        }
      });

    _controller.addListener(_videoListener);
  }

  void _videoListener() {
    if (!mounted) return;
    
    final isBuffering = _controller.value.isBuffering;
    if (isBuffering != _isBuffering) {
      setState(() => _isBuffering = isBuffering);
    }

    // Track view at 10%
    if (!_viewTracked && _controller.value.position.inSeconds > 0) {
      final watchedPercentage = (_controller.value.position.inMilliseconds / 
          _controller.value.duration.inMilliseconds) * 100;
      if (watchedPercentage >= 10) {
        _trackView(watchedPercentage);
        _viewTracked = true;
      }
    }
  }

  Future<void> _trackView(double watchedPercentage) async {
    try {
      await ApiService.trackVideoView(widget.video.id, watchedPercentage);
    } catch (e) {
      debugPrint('Error tracking view: $e');
    }
  }

  void _togglePlay() {
    setState(() {
      _controller.value.isPlaying ? _controller.pause() : _controller.play();
    });
    _showControlsTemporarily();
  }

  void _showControlsTemporarily() {
    setState(() => _showControls = true);
    _hideControlsAfterDelay();
  }

  void _hideControlsAfterDelay() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && !_showQualityMenu) {
        setState(() => _showControls = false);
      }
    });
  }

  void _changeQuality(String quality) {
    if (_quality == quality || _isChangingQuality) return;
    
    setState(() => _isChangingQuality = true);
    
    final currentTime = _controller.value.position;
    final wasPlaying = _controller.value.isPlaying;
    
    _controller.removeListener(_videoListener);
    _controller.dispose();
    
    _controller = VideoPlayerController.networkUrl(
      Uri.parse('${ApiService.baseUrl}/videos/stream/${widget.video.id}?quality=$quality'),
    )..initialize().then((_) {
        if (mounted) {
          setState(() {
            _quality = quality;
            _isChangingQuality = false;
          });
          _controller.addListener(_videoListener);
          _controller.seekTo(currentTime);
          if (wasPlaying) _controller.play();
        }
      }).catchError((error) {
        if (mounted) {
          setState(() => _isChangingQuality = false);
        }
      });
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  void _toggleFullScreen() {
    if (_isFullScreen) {
      Navigator.of(context).pop();
    } else {
      setState(() => _isFullScreen = true);
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => _FullScreenVideoPlayer(
            controller: _controller,
            video: widget.video,
            quality: _quality,
            onQualityChanged: (quality) {
              setState(() => _quality = quality);
              _changeQuality(quality);
            },
          ),
        ),
      ).then((_) {
        if (mounted) setState(() => _isFullScreen = false);
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _showControlsTemporarily,
      child: Container(
        color: Colors.black,
        child: Stack(
          children: [
            // Video Player
            Center(
              child: _controller.value.isInitialized
                  ? AspectRatio(
                      aspectRatio: _controller.value.aspectRatio,
                      child: VideoPlayer(_controller),
                    )
                  : const CircularProgressIndicator(color: Colors.red),
            ),

            // Loading Indicators
            if (_isBuffering || _isChangingQuality)
              const Center(
                child: CircularProgressIndicator(color: Colors.red),
              ),

            // Title Overlay
            if (_showControls)
              Positioned(
                top: 16,
                left: 16,
                right: 80,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.black.withOpacity(0.8), Colors.black.withOpacity(0.4)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    widget.video.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),

            // Quality Settings Button
            if (_showControls)
              Positioned(
                top: 16,
                right: 16,
                child: IconButton(
                  onPressed: () => setState(() => _showQualityMenu = !_showQualityMenu),
                  icon: const Icon(Icons.settings, color: Colors.white),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withOpacity(0.6),
                  ),
                ),
              ),

            // Quality Menu
            if (_showControls && _showQualityMenu)
              Positioned(
                top: 60,
                right: 16,
                child: Container(
                  width: 150,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Quality', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          GestureDetector(
                            onTap: () => setState(() => _showQualityMenu = false),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...['low', 'medium', 'high', 'original'].map((q) => 
                        GestureDetector(
                          onTap: () {
                            _changeQuality(q);
                            setState(() => _showQualityMenu = false);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                Icon(
                                  _quality == q ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                  color: _quality == q ? Colors.red : Colors.white,
                                  size: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  q == 'low' ? '480p' : q == 'medium' ? '720p' : q == 'high' ? '1080p' : 'Original',
                                  style: const TextStyle(color: Colors.white, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Center Play Button
            if (_showControls && !_controller.value.isPlaying)
              Center(
                child: IconButton(
                  onPressed: _togglePlay,
                  icon: const Icon(Icons.play_arrow, size: 60, color: Colors.red),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withOpacity(0.3),
                  ),
                ),
              ),

            // Bottom Controls
            if (_showControls)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black.withOpacity(0.8), Colors.transparent],
                    ),
                  ),
                  child: Column(
                    children: [
                      // Progress Bar
                      VideoProgressIndicator(
                        _controller,
                        allowScrubbing: true,
                        colors: const VideoProgressColors(
                          playedColor: Colors.red,
                          bufferedColor: Colors.grey,
                          backgroundColor: Colors.white24,
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      // Control Buttons
                      Row(
                        children: [
                          IconButton(
                            onPressed: _togglePlay,
                            icon: Icon(
                              _controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            '${_formatDuration(_controller.value.position)} / ${_formatDuration(_controller.value.duration)}',
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: _toggleFullScreen,
                            icon: const Icon(Icons.fullscreen, color: Colors.white),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _FullScreenVideoPlayer extends StatefulWidget {
  final VideoPlayerController controller;
  final Video video;
  final String quality;
  final Function(String) onQualityChanged;

  const _FullScreenVideoPlayer({
    required this.controller,
    required this.video,
    required this.quality,
    required this.onQualityChanged,
  });

  @override
  State<_FullScreenVideoPlayer> createState() => _FullScreenVideoPlayerState();
}

class _FullScreenVideoPlayerState extends State<_FullScreenVideoPlayer> {
  bool _showControls = true;
  bool _showQualityMenu = false;
  late String _currentQuality;

  @override
  void initState() {
    super.initState();
    _currentQuality = widget.quality;
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    SystemChrome.setPreferredOrientations([DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]);
    _hideControlsAfterDelay();
  }

  void _changeQualityInFullscreen(String quality) {
    if (widget.quality == quality) return;
    setState(() => _currentQuality = quality);
    widget.onQualityChanged(quality);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: SystemUiOverlay.values);
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  void _showControlsTemporarily() {
    setState(() => _showControls = true);
    _hideControlsAfterDelay();
  }

  void _hideControlsAfterDelay() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && !_showQualityMenu) {
        setState(() => _showControls = false);
      }
    });
  }

  void _togglePlay() {
    setState(() {
      widget.controller.value.isPlaying ? widget.controller.pause() : widget.controller.play();
    });
    _showControlsTemporarily();
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _showControlsTemporarily,
        child: Stack(
          children: [
            Center(
              child: widget.controller.value.isInitialized
                  ? AspectRatio(
                      aspectRatio: widget.controller.value.aspectRatio,
                      child: VideoPlayer(widget.controller),
                    )
                  : const CircularProgressIndicator(color: Colors.red),
            ),
            
            // Back Button
            if (_showControls)
              Positioned(
                top: 40,
                left: 16,
                child: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back, color: Colors.white, size: 30),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withOpacity(0.6),
                  ),
                ),
              ),

            // Title
            if (_showControls)
              Positioned(
                top: 40,
                left: 80,
                right: 80,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.black.withOpacity(0.8), Colors.black.withOpacity(0.4)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    widget.video.title,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),

            // Quality Settings Button
            if (_showControls)
              Positioned(
                top: 40,
                right: 16,
                child: IconButton(
                  onPressed: () => setState(() => _showQualityMenu = !_showQualityMenu),
                  icon: const Icon(Icons.settings, color: Colors.white),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withOpacity(0.6),
                  ),
                ),
              ),

            // Quality Menu
            if (_showControls && _showQualityMenu)
              Positioned(
                top: 90,
                right: 16,
                child: Container(
                  width: 150,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Quality', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          GestureDetector(
                            onTap: () => setState(() => _showQualityMenu = false),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...['low', 'medium', 'high', 'original'].map((q) => 
                        GestureDetector(
                          onTap: () {
                            _changeQualityInFullscreen(q);
                            setState(() => _showQualityMenu = false);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                Icon(
                                  _currentQuality == q ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                  color: _currentQuality == q ? Colors.red : Colors.white,
                                  size: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  q == 'low' ? '480p' : q == 'medium' ? '720p' : q == 'high' ? '1080p' : 'Original',
                                  style: const TextStyle(color: Colors.white, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Center Play Button
            if (_showControls && !widget.controller.value.isPlaying)
              Center(
                child: IconButton(
                  onPressed: _togglePlay,
                  icon: const Icon(Icons.play_arrow, size: 60, color: Colors.red),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black.withOpacity(0.3),
                  ),
                ),
              ),

            // Bottom Controls
            if (_showControls)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black.withOpacity(0.8), Colors.transparent],
                    ),
                  ),
                  child: Column(
                    children: [
                      VideoProgressIndicator(
                        widget.controller,
                        allowScrubbing: true,
                        colors: const VideoProgressColors(
                          playedColor: Colors.red,
                          bufferedColor: Colors.grey,
                          backgroundColor: Colors.white24,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          IconButton(
                            onPressed: _togglePlay,
                            icon: Icon(
                              widget.controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            '${_formatDuration(widget.controller.value.position)} / ${_formatDuration(widget.controller.value.duration)}',
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.fullscreen_exit, color: Colors.white),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}