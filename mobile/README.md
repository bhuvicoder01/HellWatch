# HellWatch Mobile App

Flutter mobile app for the HellWatch streaming platform.

## Setup

1. Install Flutter SDK
2. Run `flutter pub get` to install dependencies
3. Update API URL in `lib/services/api_service.dart` to your backend server
4. Run `flutter run` to start the app

## Features

- User authentication
- Video streaming with video player
- Audio streaming with audio player
- Thumbnail display for songs
- Mini audio player
- Material Design UI

## API Integration

The app connects to your existing HellWatch backend at:
- Videos: `/videos` endpoint
- Songs: `/songs` endpoint  
- Authentication: `/auth/login` endpoint
- Streaming: `/videos/stream/:id` and `/songs/stream/:id`

## Dependencies

- `http`: API requests
- `video_player`: Video playback
- `audioplayers`: Audio playback
- `cached_network_image`: Image caching
- `flutter_secure_storage`: Secure token storage
- `shared_preferences`: Local storage