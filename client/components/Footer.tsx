'use client'

import { useSong } from "@/contexts/MediaContext";
import { API_URL } from "@/services/api";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepForward, faStepBackward } from '@fortawesome/free-solid-svg-icons'
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons'
export default function Footer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { Songs, currentSong, setCurrentSong } = useSong();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showFullView, setShowFullView] = useState(false)
    const [thumbnail, setThumbnail] = useState<string | undefined>(undefined)
    const thumbnailUrlRef = useRef<string | undefined>(undefined);

    //fetch thumbnail early to render quick
    useEffect(() => {
        if (currentSong) {
            fetch(`${API_URL}/songs/${currentSong?.id}/thumbnail`)
                .then((res) => res.blob())
                .then((blob) => {
                    if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current);
                    const url = URL.createObjectURL(blob);
                    thumbnailUrlRef.current = url;
                    setThumbnail(url);
                })
        } else {
            if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current);
            thumbnailUrlRef.current = undefined;
            setThumbnail(undefined);
        }
    }, [currentSong])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current);
        };
    }, []);
    useEffect(() => {
        if (audioRef.current && currentSong) {
            audioRef.current.load();
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, [currentSong]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const skipToNext = () => {
        if (!currentSong) return;
        const currentIndex = Songs.findIndex((song: any) => song.id === currentSong.id);
        const nextIndex = currentIndex + 1 < Songs.length ? currentIndex + 1 : 0;
        setCurrentSong(Songs[nextIndex] as any);
    };

    const skipToPrevious = () => {
        if (!currentSong) return;
        const currentIndex = Songs.findIndex((song: any) => song.id === currentSong.id);
        const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : Songs.length - 1;
        setCurrentSong(Songs[prevIndex] as any);
    };

    return (
        <>
            <footer className="footer py-4">
                {currentSong && (<>
                    {showFullView && <div className="fullview-song">
                        <div className="fullview-img-container">
                            <img src={thumbnail} />
                        </div>

                        {/* <div className="info">
                    <div className="title">{currentSong?.title}</div>
                    <div className="artist">{currentSong?.artist}</div>
                </div> */}
                    </div>}
                    <div className="audio-player">
                        <audio
                            ref={audioRef}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={skipToNext}
                        >
                            <source src={`${API_URL}/songs/stream/${currentSong.id}`} type="audio/mpeg" />
                        </audio>

                        <div className="player-container">
                              <div className="song-info" onClick={() => setShowFullView(!showFullView)}>
                                <div className="song-title">{currentSong.title}</div>
                                <div className="song-artist">{currentSong.artist}</div>
                            </div>
                            <div className="control-btn">
                                    <button className="control-btn" onClick={skipToPrevious}><FontAwesomeIcon icon={faStepBackward}/> </button>
                                    <button className="control-btn " onClick={togglePlay}><FontAwesomeIcon icon={isPlaying?faPause:faPlay}/>
                                    </button>
                                    <button className="control-btn" onClick={skipToNext}><FontAwesomeIcon icon={faStepForward}/></button>
                                    {/* <i >{FaPlay}</i> */}
                                </div>

                            <div className="player-controls">
                               
                               
                                <div className="progress-container">
                                    <span className="time">{formatTime(currentTime)}</span>
                                    <input
                                        type="range"
                                        className="progress-bar"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                    />
                                    <span className="time">{formatTime(duration)}</span>
                                </div>

                                <div className="volume-container">
                                    <span>🔊</span>
                                    <input
                                        type="range"
                                        className="volume-bar"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>)}
                <div className="container mx-auto text-center">
                    <p>&copy; 2023 My Website. All rights reserved.</p>
                </div>
            </footer>
            <style jsx>
                {`
                .control-btn {
  background: none;
  border: none;
  color: red;
  font-size: 27px;
  cursor: pointer;
  margin: 0 5px 0 0;
  padding: 0 5 0 2;

}

.play-btn {
  /* Creates a triangle using borders */
//   width: 0;
//   height: 0;
font-size:5px;
 
//   background: none;
  cursor: pointer;
//   border-radius: 2px;
 
}

.pause-btn {
  /* Creates two vertical bars */
  width: 0;
  height: 25px;
   margin-right: 10px;
  padding-right: 5px;
  border-top:transparent;
  border-left: 7px solid red;
  border-right: 7px solid red;
  border-bottom:transparent;
  background: none;
  cursor: pointer;
  box-sizing: border-box; /* Ensures padding/border are included in width/height */
}`}
            </style>
        </>
    );
}