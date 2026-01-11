# 🚀 HellWatch Streaming Platform

A full-stack video and audio streaming platform built with Next.js and Express.js, featuring video transcoding, Apple Music integration, and cloud storage.

## ✨ Features

- **Video Streaming**: Upload, transcode, and stream videos with multiple quality options
- **Audio Streaming**: Upload and stream audio files with metadata support
- **Apple Music Integration**: Search and discover music through Apple Music API
- **User Authentication**: Secure JWT-based authentication system
- **Cloud Storage**: AWS S3 integration for scalable media storage
- **Video Transcoding**: Automatic video processing with FFmpeg
- **Responsive Design**: Modern UI built with Tailwind CSS and Bootstrap
- **Real-time Streaming**: Optimized video player with custom controls

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Bootstrap 5** - UI components and styling
- **Axios** - HTTP client for API requests

### Backend
- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **FFmpeg** - Video transcoding and processing
- **AWS S3** - Cloud storage for media files
- **Multer** - File upload middleware

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- AWS S3 bucket and credentials
- FFmpeg installed on system
- Apple Music API credentials (optional)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd HellWatch
```

### 2. Install dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Environment Configuration

**Server (.env):**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name

# Apple Music API (Optional)
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key
```

**Client (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🏃‍♂️ Running the Application

### Development Mode

**Start the backend server:**
```bash
cd server
npm run dev
```

**Start the frontend client:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

**Build and start backend:**
```bash
cd server
npm start
```

**Build and start frontend:**
```bash
cd client
npm run build
npm start
```

## 📁 Project Structure

```
HellWatch/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   └── types/             # TypeScript definitions
├── server/                # Express.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   └── uploads/          # Temporary file storage
└── services/             # Shared services
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Videos
- `GET /videos` - Get all videos
- `POST /videos/upload` - Upload video
- `GET /videos/stream/:id` - Stream video
- `DELETE /videos/:id` - Delete video

### Audio
- `GET /songs` - Get all songs
- `POST /songs/upload` - Upload audio
- `GET /songs/stream/:id` - Stream audio

### Apple Music
- `GET /apple-music/search` - Search Apple Music
- `GET /apple-music/token` - Get developer token

## 🎯 Key Features Explained

### Video Transcoding
The platform automatically transcodes uploaded videos into multiple qualities using FFmpeg, ensuring optimal streaming performance across different devices and network conditions.

### Cloud Storage
All media files are stored in AWS S3 with presigned URLs for secure access. The system supports both direct uploads and streaming.

### Authentication System
JWT-based authentication with secure cookie storage, providing seamless user experience while maintaining security.

### Custom Video Player
Built-in video player with custom controls, quality selection, and optimized streaming capabilities.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

**FFmpeg not found:**
- Install FFmpeg on your system
- Ensure it's added to your system PATH

**MongoDB connection issues:**
- Verify MongoDB is running
- Check connection string format
- Ensure network access to MongoDB instance

**AWS S3 upload failures:**
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure correct region configuration

## 📞 Support

For support and questions, please open an issue in the repository.