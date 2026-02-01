import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hellwatch_mobile/services/api_service.dart';
import 'dart:convert' as json;
import '../services/auth_service.dart';
import '../widgets/image_title.dart';
import 'login_screen.dart';
import 'videos_screen.dart';
import 'songs_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isSidebarOpen = false;
  final _storage = const FlutterSecureStorage();
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;
  late Animation<double> _fadeAnimation;

  final List<Widget> _screens = [
    const VideosScreen(),
    const SongsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _toggleSidebar() {
    setState(() {
      _isSidebarOpen = !_isSidebarOpen;
    });
    if (_isSidebarOpen) {
      _animationController.forward();
    } else {
      _animationController.reverse();
    }
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 2.0, // Custom spacing for this AppBar
        title: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: const ImageTitle(
            assetPath: 'assets/images/logo.png',
            fallbackText: 'HellWatch',
            height: 52,
            width: 180,
          ),
        ),
        actions: [
          GestureDetector(
            onTap: _toggleSidebar,
            child: Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: FutureBuilder<String?>(
                future: _storage.read(key: 'user'),
                builder: (context, snapshot) {
                  String avatarUrl = 'https://example.com/default-avatar.png';
                  if (snapshot.hasData && snapshot.data != null) {
                    try {
                      final userData = json.jsonDecode(snapshot.data!);
                      // print(  'userData: $userData'); // Debug print    
                      // Proxy image through your backend to avoid CORS
                      if (userData['avatar']?['url'] != null) {
                        avatarUrl = '${ApiService.baseUrl}/proxy-image?url=${Uri.encodeComponent(userData['avatar']['url'])}';
                      }
                      // print('avatarUrl: $avatarUrl');
                    } catch (e) {
                      avatarUrl = 'https://example.com/default-avatar.png';
                    }
                  }
                  return CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.grey[700],
                    child: snapshot.hasData && snapshot.data != null
                        ? ClipOval(
                            child: Image.network(
                              avatarUrl,
                              width: 36,
                              height: 36,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(Icons.person, color: Colors.white);
                              },
                            ),
                          )
                        : const Icon(Icons.person, color: Colors.white),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          _screens[_currentIndex],
          AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return _isSidebarOpen
                  ? GestureDetector(
                      onTap: _toggleSidebar,
                      child: Container(
                        color: Colors.black54.withOpacity(_fadeAnimation.value * 0.6),
                        width: double.infinity,
                        height: double.infinity,
                      ),
                    )
                  : const SizedBox.shrink();
            },
          ),
          AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return _isSidebarOpen
                  ? Positioned(
                      right: -250 * _slideAnimation.value,
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 250,
                        color: Colors.grey[900],
                        child: Column(
                          children: [
                            ListTile(
                              leading: const Icon(Icons.settings, color: Colors.white),
                              title: const Text('Settings',
                                  style: TextStyle(color: Colors.white)),
                              onTap: () {
                                _toggleSidebar();
                                // Add settings functionality
                              },
                            ),
                            ListTile(
                              leading: const Icon(Icons.logout, color: Colors.white),
                              title: const Text('Logout',
                                  style: TextStyle(color: Colors.white)),
                              onTap: () {
                                _toggleSidebar();
                                _logout();
                              },
                            ),
                          ],
                        ),
                      ),
                    )
                  : const SizedBox.shrink();
            },
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.black,
        selectedItemColor: Colors.red,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.video_library),
            label: 'Videos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.music_note),
            label: 'Songs',
          ),
        ],
      ),
    );
  }
}
