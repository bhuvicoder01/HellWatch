import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hellwatch_mobile/services/api_service.dart';
import 'package:flutter/services.dart';
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
     SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp
    ]);
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 400),
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
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
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
        automaticallyImplyLeading: false,
        centerTitle: true,
        title: const ImageTitle(
          assetPath: 'assets/images/logo3.png',
          fallbackText: 'HellWatch',
          height: 52,
          width: 200
        ),
        actions: [
          GestureDetector(
            onTap: _toggleSidebar,
            child: Padding(
              padding: const EdgeInsets.only(left:0.0,right: 16.0),
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
                        avatarUrl =
                            '${ApiService.baseUrl}/proxy-image?url=${Uri.encodeComponent(userData['avatar']['url'])}';
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
                                return const Icon(Icons.person,
                                    color: Colors.white);
                              },
                            ),
                          )
                        : const Icon(Icons.person, color: Colors.white),
                  );
                },
              ),
            ),
          ),
        ]),
      body: Stack(
        children: [
          // Background GIF
          Positioned.fill(
            child: Image.asset(
              'assets/gifs/bg2.gif',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF1a1a1a), Color(0xFF000000)],
                    ),
                  ),
                );
              },
            ),
          ),
          SizedBox.expand(
            child: Opacity(
                opacity: _isSidebarOpen ? 0.3 : 1.0,
                child: Stack(
                  children: [
                    Card(
                      clipBehavior: Clip.antiAlias,
                      elevation: 4.0,
                      color: const Color.fromARGB(200, 255, 0, 0),
                      margin: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(
                              MediaQuery.of(context).size.width * 0.04),
                          bottomRight: Radius.circular(
                              MediaQuery.of(context).size.width * 0.04),
                        ),
                      ),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          'Welcome to HellWatch! Stay tuned for updates',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: MediaQuery.of(context).size.width * 0.04,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 80.0),
                      child: _screens[_currentIndex],
                    ),
                  ],
                )),
          ),
          AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return _isSidebarOpen
                  ? GestureDetector(
                      onTap: _toggleSidebar,
                      child: Container(
                        color: Colors.black54
                            .withOpacity(_fadeAnimation.value * 0.6),
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
                        color: const Color.fromARGB(255, 0, 0, 0),
                        child: Column(
                          children: [
                            ListTile(
                              leading: const Icon(Icons.settings,
                                  color: Color.fromARGB(255, 255, 0, 0)),
                              title: const Text('Settings',
                                  style: TextStyle(color: Colors.white)),
                              onTap: () {
                                _toggleSidebar();
                              },
                            ),
                            ListTile(
                              leading:
                                  const Icon(Icons.logout, color: Color.fromARGB(255, 255, 0, 0)),
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
        selectedItemColor: const Color.fromARGB(255, 255, 0, 0),
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
