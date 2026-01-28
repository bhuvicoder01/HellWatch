'use client';

import { useEffect, useState } from "react";
import { API_URL } from "@/services/api";
import { useVideo, useSong } from "@/contexts/MediaContext";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faMusic, faVideo, faFire, faClock, faStar } from "@fortawesome/free-solid-svg-icons";

interface Video {
  _id: string;
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  views?: number;
  stats?: {
    views?: number;
  };
  owner?: {
    username?: string;
  };
  createdAt: string;
}

interface Song {
  _id: string;
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  owner?: {
    username?: string;
  };
  createdAt: string;
}

const LazyImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 animate-pulse flex items-center justify-center">
          <FontAwesomeIcon icon={faVideo} className="text-white text-2xl opacity-50" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        style={{ objectFit: "cover" }}
        width="100%"
        height="100%"
        loading="lazy"
      />
    </div>
  );
};

export default function Home() {
  const { Videos, refreshVideos } = useVideo();
  const { Songs, refreshSongs } = useSong();
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([refreshVideos(), refreshSongs()]);
        
        // Sort videos by views for trending
        const trending = [...Videos].sort((a: any, b: any) => ((b?.stats?.views || b?.views) || 0) - ((a?.stats?.views || a?.views) || 0)).slice(0, 6);
        setTrendingVideos(trending);
        
        // Sort by creation date for recent
        const recent = [...Videos].sort((a: any, b: any) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()).slice(0, 6);
        setRecentVideos(recent);
        
        // Featured videos (first 6)
        setFeaturedVideos(Videos.slice(0, 6));
        
        // Featured songs (first 6)
        setFeaturedSongs(Songs.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, [Videos.length,Songs.length]);

  const MediaCard = ({ item, type }: { item: Video | Song; type: 'video' | 'song' }) => {
    const itemId = item._id || item.id;
    
    return (
    <Link href={type === 'video' ? `/videos/details?id=${itemId}` : `/songs?play=${itemId}`} className="video-card no-underline" style={{textDecoration: 'none'}}>
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full max-w-xs mx-auto">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-red-600 to-red-800">
          {item.thumbnail && itemId ? (
            <LazyImage 
              src={`${API_URL}/${type === 'video' ? 'videos' : 'songs'}/${itemId}/thumbnail`} 
              alt={item.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="flex items-center justify-center">
              <FontAwesomeIcon 
                icon={type === 'video' ? faVideo : faMusic} 
                className="text-white text-l sm:text-3xl opacity-70" 
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <FontAwesomeIcon 
              icon={faPlay} 
              className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
            />
          </div>
          {type === 'video' && 'stats' in item && (
            <div className="absolute top-1 right-1 bg-black bg-opacity-80 text-white px-1 py-0.5 rounded" style={{fontSize: '8px'}}>
              {item?.stats?.views || 0} views
            </div>
          )}
        </div>
        <div className="p-1">
          <h3 className="text-white font-medium text-xs truncate group-hover:text-red-400 transition-colors" title={item.title} style={{fontSize: '10px'}}>
            {item.title}
          </h3>
          {'owner' in item && item.owner?.username && (
            <p className="text-gray-400 truncate" title={item.owner.username} style={{fontSize: '7px'}}>{item.owner.username}</p>
          )}
        </div>
      </div>
    </Link>
    );
  };

  const SectionHeader = ({ title, icon, count }: { title: string; icon: any; count?: number }) => (
    <div className="flex items-center gap-3 mb-6">
      <FontAwesomeIcon icon={icon} className="text-red-500 text-2xl" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {count && <span className="text-gray-400 text-sm">({count})</span>}
    </div>
  );

  return (
    <main className=" bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-12" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-4">
            HellWatch
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your ultimate destination for streaming videos and music. Discover trending content, 
            explore new releases, and enjoy unlimited entertainment.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link href="/videos/upload" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faVideo} />
            Upload Video
          </Link>
          <Link href="/songs/upload" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faMusic} />
            Upload Song
          </Link>
        </div>

        {/* Featured Videos */}
        <section className="mb-12">
          <SectionHeader title="Featured Videos" icon={faStar} count={featuredVideos.length} />
          <div className="video-grid">
            {featuredVideos.map((video) => (
              <MediaCard key={video._id || video.id} item={video} type="video" />
            ))}
          </div>
          {featuredVideos.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <FontAwesomeIcon icon={faVideo} className="text-4xl mb-4" />
              <p>No featured videos available</p>
            </div>
          )}
        </section>

        {/* Trending Videos */}
        <section className="mb-12">
          <SectionHeader title="Trending Videos" icon={faFire} count={trendingVideos.length} />
          <div className="video-grid">
            {trendingVideos.map((video) => (
              <MediaCard key={video._id || video.id} item={video} type="video" />
            ))}
          </div>
          {trendingVideos.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <FontAwesomeIcon icon={faFire} className="text-4xl mb-4" />
              <p>No trending videos available</p>
            </div>
          )}
        </section>

        {/* Recently Uploaded */}
        <section className="mb-12">
          <SectionHeader title="Recently Uploaded" icon={faClock} count={recentVideos.length} />
          <div className="video-grid">
            {recentVideos.map((video) => (
              <MediaCard key={video._id || video.id} item={video} type="video" />
            ))}
          </div>
          {recentVideos.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <FontAwesomeIcon icon={faClock} className="text-4xl mb-4" />
              <p>No recent videos available</p>
            </div>
          )}
        </section>

        {/* Featured Songs */}
        <section className="mb-12">
          <SectionHeader title="Featured Songs" icon={faMusic} count={featuredSongs.length} />
          <div className="video-grid">
            {featuredSongs.map((song) => (
              <MediaCard key={song._id || song.id} item={song} type="song" />
            ))}
          </div>
          {featuredSongs.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <FontAwesomeIcon icon={faMusic} className="text-4xl mb-4" />
              <p>No featured songs available</p>
            </div>
          )}
        </section>

        {/* Browse All */}
        <section className="text-center mb-12 pb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Explore More</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/videos" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center gap-3">
              <FontAwesomeIcon icon={faVideo} className="text-red-500" />
              Browse All Videos
            </Link>
            <Link href="/songs" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center gap-3">
              <FontAwesomeIcon icon={faMusic} className="text-red-500" />
              Browse All Songs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
