'use client';

import { SongContextType } from '@/contexts/MediaContext';
import { api } from '@/services/api';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    MusicKit: any;
  }
}

export default function AppleMusicPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [musicKit, setMusicKit] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const initMusicKit = async () => {
      // Load MusicKit script
      if (!window.MusicKit) {
        const script = document.createElement('script');
        script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
        script.onload = async () => {
          try {
            // Get developer token from server
            const tokenRes = await api.get('/apple-music/token');
            const { token } = await tokenRes.data;

            // Configure MusicKit
            window.MusicKit.configure({
              developerToken: token,
              app: {
                name: 'HellWatch',
                build: '1.0.0'
              }
            });

            const mk = window.MusicKit.getInstance();
            setMusicKit(mk);

            // Check if already authorized
            if (mk.isAuthorized) {
              setIsAuthorized(true);
            }
          } catch (err) {
            console.error('Failed to initialize MusicKit:', err);
          }
        };
        document.head.appendChild(script);
      }
    };

    initMusicKit();
  }, []);

  const authorize = async () => {
    if (musicKit) {
      try {
        await musicKit.authorize();
        setIsAuthorized(true);
      } catch (err) {
        console.error('Authorization failed:', err);
      }
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/apple-music/search?term=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results?.songs?.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    }
    setLoading(false);
  };

  const playSong = async (songId: string) => {
    if (musicKit && isAuthorized) {
      try {
        await musicKit.setQueue({ song: songId });
        await musicKit.play();
      } catch (err) {
        console.error('Failed to play song:', err);
      }
    } else {
      alert('Please authorize with Apple Music first.');
    }
  };

  const handleKeyPress = (e:any) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Apple Music Search</h1>
      {!isAuthorized && (
        <button onClick={authorize} style={{ padding: '10px 20px', marginBottom: '20px' }}>
          Authorize with Apple Music
        </button>
      )}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for songs..."
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <button onClick={search} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div style={{ marginTop: '20px' }}>
        {results.map((song:SongContextType) => (
          <div key={song.id} style={{ marginBottom: '20px', border: '1px solid #333', padding: '10px', borderRadius: '5px' }}>
            <h3>{song.attributes.name}</h3>
            <p>Artist: {song.attributes.artistName}</p>
            <p>Album: {song.attributes.albumName}</p>
            <button onClick={() => playSong(song.id)} style={{ padding: '5px 10px' }}>
              Play Full Song
            </button>
          </div>
        ))}
        {results.length === 0 && !loading && query && <p>No results found.</p>}
      </div>
    </div>
  );
}