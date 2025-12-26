'use client'

import { useSong } from "@/contexts/MediaContext";
import { API_URL } from "@/services/api";
import { useEffect, useRef, useState } from "react";

export default function Footer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { currentSong } = useSong();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        if (audioRef.current && currentSong) {
            audioRef.current.load();
            setIsPlaying(false);
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

    return (
        <>
            <footer className="footer py-4">
                {currentSong && (
                    <div className="audio-player">
                        <audio
                            ref={audioRef}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        >
                            <source src={`${API_URL}/songs/stream/${currentSong.id}`} type="audio/mpeg" />
                        </audio>

                        <div className="player-container">
                            <div className="song-info">
                                <div className="song-title">{currentSong.title}</div>
                                <div className="song-artist">{currentSong.artist}</div>
                            </div>

                            <div className="player-controls">
                                <div className="control-btn "style={{background:'none'}}>
                                <button className={` ${isPlaying?'pause-btn':'play-btn'}`}  onClick={togglePlay}>
                                </button>
</div>
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
                )}
                <div className="container mx-auto text-center">
                    <p>&copy; 2023 My Website. All rights reserved.</p>
                </div>
            </footer>
            <style jsx>
                {`
                .play-btn {
  /* Creates a triangle using borders */
  width: 0;
  height: 0;
  border-top: 18px solid transparent;
  border-bottom: 15px solid transparent;
  border-left: 32px solid red; /* The "play" arrow */
  border-right:transparent;
  background: none;
  cursor: pointer;
  border-radius: 2px;
 
}

.pause-btn {
  /* Creates two vertical bars */
  width: 0;
  height: 25px;
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