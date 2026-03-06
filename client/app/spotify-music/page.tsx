'use client'
import { api } from "@/services/api";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SpotifyMusicPage = () => {
    const searchParams = useSearchParams();
    const [accessToken, setAccessToken] = useState<string>('');
    const [artist, setArtist] = useState<any>(null);
    const [player, setPlayer] = useState<any>(undefined);
    const [track, setTrack] = useState({
        name: "",
        album: {
            images: [{ url: "" }]
        },
        artists: [{ name: "" }]
    });
    const [paused, setPaused] = useState(true);
    const [active, setActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [deviceId, setDeviceId] = useState('');
    const [refreshToken, setRefreshToken] = useState('');


    async function getAccessToken() {
        const tokenRes = await api.get('/songs/spotify-token');
        console.log(tokenRes)
        setAccessToken(tokenRes.data.access_token);

    }
    async function getArtistInfo(accessToken: string) {
        const artistRes = await fetch('https://api.spotify.com/v1/artists/4Z8W4fKeB5YxbusRsdQVPb', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const data = await artistRes.json();
        console.log(data);
        setArtist(data);
    }

    async function searchTracks() {
        if (!searchQuery) return;
        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.status === 401) {
            await refreshAccessToken();
            return;
        }
        const data = await res.json();
        setSearchResults(data.tracks?.items || []);
    }

    async function playTrack(uri: string) {
        if (!deviceId) {
            alert('Player not ready yet. Please wait.');
            return;
        }
        try {
            const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uris: [uri] })
            });
            if (res.status === 401) {
                await refreshAccessToken();
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function refreshAccessToken() {
        const refresh = refreshToken || localStorage.getItem('spotify_refresh_token');
        if (!refresh) {
            console.log('No refresh token, please login again');
            handleAuthExpired();
            return;
        }
        
        try {
            const res = await api.post('/songs/spotify-refresh', { refresh_token: refresh });
            setAccessToken(res.data.access_token);
            localStorage.setItem('spotify_access_token', res.data.access_token);
            localStorage.setItem('spotify_token_expiry', String(Date.now() + 3600000));
        } catch (error) {
            console.error('Token refresh failed:', error);
            handleAuthExpired();
        }
    }

    function handleAuthExpired() {
        localStorage.clear();
        setAccessToken('');
        setRefreshToken('');
        setDeviceId('');
        if (player) {
            player.disconnect();
            setPlayer(undefined);
        }
        alert('Session expired. Please login again.');
    }

    useEffect(() => {
        const token = searchParams.get('access_token');
        const refresh = searchParams.get('refresh_token');
        if (token) {
            setAccessToken(token);
            localStorage.setItem('spotify_access_token', token);
            localStorage.setItem('spotify_token_expiry', String(Date.now() + 3600000)); // 1 hour
            setRefreshToken(refresh || '');
            if (refresh) {
                localStorage.setItem('spotify_refresh_token', refresh);
            }
            return;
        }

        // Check for existing token on mount
        const storedToken = localStorage.getItem('spotify_access_token');
        const storedRefresh = localStorage.getItem('spotify_refresh_token');
        const expiry = localStorage.getItem('spotify_token_expiry');
        
        if (storedToken && expiry && Date.now() < Number(expiry)) {
            setAccessToken(storedToken);
            setRefreshToken(storedRefresh || '');
        } else if (storedRefresh) {
            // Token expired, refresh it
            setRefreshToken(storedRefresh);
            refreshAccessToken();
        }
    }, [searchParams])

    
    const initializePlayer = () => {
        const player = new (window as any).Spotify.Player({
            name: 'Web Playback SDK',
            getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
            volume: 0.5
        });

        setPlayer(player);

        player.addListener('ready', ({ device_id }: any) => {
            console.log('Ready with Device ID', device_id);
            setDeviceId(device_id);
        });

        player.addListener('not_ready', ({ device_id }: any) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.addListener('player_state_changed', (state: any) => {
            if (!state) return;
            setTrack(state.track_window.current_track);
            setPaused(state.paused);
            player.getCurrentState().then((state: any) => { 
                setActive(!!state);
            });
        });

        player.connect();
        

    };

    useEffect(() => {
        if (!accessToken) return;

        if ((window as any).Spotify) {
            initializePlayer();
            return;
        }

        const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            document.body.appendChild(script);
        }

        (window as any).onSpotifyWebPlaybackSDKReady = () => {
            initializePlayer();
            
        };
    }, [accessToken]);

  return (
    <>
    <div>
      <h1>Spotify Music</h1>
      <p>Welcome to the Spotify Music page!</p>
      {!accessToken && (
        <a href="http://127.0.0.1:5000/songs/spotify-login">
          <button>Login with Spotify</button>
        </a>
      )}
      {/* {accessToken && <p style={{overflow:'hidden', textOverflow:'ellipsis'}}>Token: {accessToken}</p>}
      {deviceId && <p>Device Ready: {deviceId}</p>} */}
    </div>
    {/* <div>
        {accessToken && <button onClick={() => getArtistInfo(accessToken)}>Get Artist Info</button>}
        {artist && <p>{artist.name}</p>}
        {artist && artist.images?.[0] && <img src={artist.images[0].url} alt="Artist Image" style={{width:'200px'}}/>}
    </div> */}
    {accessToken && (
        <div style={{margin: '20px 0'}}>
            <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs..."
                style={{padding: '10px', width: '300px'}}
            />
            <button onClick={searchTracks} style={{marginLeft: '10px'}}>Search</button>
            <div style={{marginTop: '20px'}}>
                {searchResults.map((track) => (
                    <div key={track.id} style={{padding: '10px', borderBottom: '1px solid #ccc'}}>
                        <img src={track.album.images[2]?.url} alt="" style={{width: '50px', marginRight: '10px'}} />
                        <span>{track.name} - {track.artists[0].name}</span>
                        <button onClick={() => playTrack(track.uri)} style={{marginLeft: '10px'}}>Play</button>
                    </div>
                ))}
            </div>
        </div>
    )}
     <div className="container">
           <div className="main-wrapper">
                {player && active && (
                    <div>
                        <h3>Now Playing: {track.name}</h3>
                        <img src={track.album.images[0]?.url} alt="Album" style={{width: '300px'}} />
                        <p>Artist: {track.artists[0]?.name}</p>
                        <button onClick={() => player.togglePlay()}>
                            {paused ? 'Play' : 'Pause'}
                        </button>
                        <button onClick={() => player.previousTrack()}>Previous</button>
                        <button onClick={() => player.nextTrack()}>Next</button>
                    </div>
                )}
            </div>
        </div>
</>
  );
};

export default SpotifyMusicPage;