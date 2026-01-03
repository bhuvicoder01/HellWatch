"use client";

import { useSong } from "@/contexts/MediaContext";
import { API_URL } from "@/services/api";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStepForward,
  faStepBackward,
} from "@fortawesome/free-solid-svg-icons";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { faHome, faVideo, faMusic } from "@fortawesome/free-solid-svg-icons";
import {
  faVolumeUp,
  faVolumeDown,
  faVolumeMute,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { Songs, currentSong, setCurrentSong } = useSong();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showFullView, setShowFullView] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const thumbnailUrlRef = useRef<string | undefined>(undefined);
  const [isPageReloaded, setIsPageReloaded] = useState(true);
  const pathname = usePathname();

  //fetch thumbnail early to render quick
  useEffect(() => {
    if (currentSong) {
      fetch(`${API_URL}/songs/${currentSong?.id}/thumbnail`)
        .then((res) => res.blob())
        .then((blob) => {
          if (thumbnailUrlRef.current)
            URL.revokeObjectURL(thumbnailUrlRef.current);
          const url = URL.createObjectURL(blob);
          thumbnailUrlRef.current = url;
          setThumbnail(url);
        });
    } else {
      if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current);
      thumbnailUrlRef.current = undefined;
      setThumbnail(undefined);
    }
  }, [currentSong]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.load();

      // Guard localStorage access with typeof window !== 'undefined' for SSR/type-safety
      const savedTime =
        typeof window !== "undefined"
          ? localStorage.getItem("currentTime")
          : null;

      if (savedTime !== null && isPageReloaded) {
        setIsPageReloaded(false);
        audioRef.current.currentTime = savedTime ? parseFloat(savedTime) : 0;
      } else {
        // try to play when no saved time to resume
        audioRef.current.play();
        setIsPlaying(true);
      }
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
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "currentTime",
          audioRef.current.currentTime.toString()
        );
      }
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
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const getVolumeIcon = () => {
    if (volume === 0) return faVolumeMute;
    if (volume < 0.5) return faVolumeDown;
    return faVolumeUp;
  };

  const skipToNext = () => {
    if (!currentSong) return;
    const currentIndex = Songs.findIndex(
      (song: any) => song.id === currentSong.id
    );
    const nextIndex = currentIndex + 1 < Songs.length ? currentIndex + 1 : 0;
    setCurrentSong(Songs[nextIndex] as any);
  };

  const skipToPrevious = () => {
    if (!currentSong) return;
    const currentIndex = Songs.findIndex(
      (song: any) => song.id === currentSong.id
    );
    const prevIndex =
      currentIndex - 1 >= 0 ? currentIndex - 1 : Songs.length - 1;
    setCurrentSong(Songs[prevIndex] as any);
  };

  const isMainPage =
    ["/", "/videos", "/songs"].includes(pathname) ||
    pathname.startsWith("/videos/") ||
    pathname.startsWith("/songs/") ||
    pathname.startsWith("/profile");
  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const volumePct = volume * 100;

 const sliderFill = (pct: number) =>
    `linear-gradient(to right, #ff0000 ${pct}%, #333 ${pct}%)`;
  const getPlayButtonBorderColor = () => isPlaying ? `red` : 'white';
  return (
    <>
      <footer className="footer py-4">
        {currentSong && (
          <>
            {showFullView && (
              <div className="fullview-song">
                <div className="fullview-img-container">
                  <img src={thumbnail} />
                </div>

                {/* <div className="info">
                    <div className="title">{currentSong?.title}</div>
                    <div className="artist">{currentSong?.artist}</div>
                </div> */}
              </div>
            )}
            <div className="audio-player">
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={skipToNext}
              >
                <source
                  src={`${API_URL}/songs/stream/${currentSong.id}`}
                  type="audio/mpeg"
                />
              </audio> 

              <div className="player-container">
                <div
                  className="song-info"
                  onClick={() => setShowFullView(!showFullView)}
                >
                  <div className="song-title">{currentSong.title}</div>
                  {/* <div className="song-artist">{currentSong.artist}</div> */}
                  {/* <div className="song-cover"><img src={`${API_URL}/songs/${currentSong.id}/thumbnail`}/></div> */}
                </div>
                <div
                  className="d-flex rows"
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <button className="control-btn" onClick={skipToPrevious}>
                    <FontAwesomeIcon icon={faStepBackward} />{" "}
                  </button>

                  <button
                    className="control-btn play-pause-btn"
                    onClick={togglePlay}
                    style={{
                      backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderColor: getPlayButtonBorderColor()
                    }}
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                  </button>
                  <button className="control-btn" onClick={skipToNext}>
                    <FontAwesomeIcon icon={faStepForward} />
                  </button>
                  {/* <i >{FaPlay}</i> */}
                </div>

                <div className="player-controls">
                  <div className="progress-container">
                    <span className="time">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      className="progress-bar"
                      min="0"
                      max={duration || 1}
                      value={currentTime}
                      onChange={handleSeek}
                      style={{ background: sliderFill(progressPct) }}
                    />
                    <span className="time">{formatTime(duration)}</span>
                  </div>

                  <div className="volume-container">
                    <FontAwesomeIcon className='text-white' icon={getVolumeIcon()} />
                    <input
                      type="range"
                      className="volume-bar"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      style={{ background: sliderFill(volumePct) }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {isMainPage && (
          <div className="footer-links">
            <Link
              href={`/`}
              className={`footer-link ${pathname === "/" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faHome} />
              <span>Home</span>
            </Link>
            <Link
              href={`/videos`}
              className={`footer-link ${
                pathname === "/videos" ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={faVideo} />
              <span>Videos</span>
            </Link>
            <Link
              href={`/songs`}
              className={`footer-link ${pathname === "/songs" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faMusic} />
              <span>Songs</span>
            </Link>
          </div>
        )}
      </footer>
      <style jsx>
        {`
          .control-btn {
            display: flex;
            background: none;
            border: none;
            color: red;
            font-size: 27px;
            cursor: pointer;
            //   margin: 0 5px 0 0;
            //   padding: 0 5 0 2;
            align-items: center;
            justify-content: center;
          }

          .play-pause-btn {
            /* Creates a triangle using borders */
            background-color: rgba(255, 255, 255, 1);
            color:red;
            align-items: center;
            width: 50px;
            height: 50px;
            border-radius: 60%;
            border: 1px solid transparent;
            }
          .song-cover{
          width:50px
          max-wdith:50px;
          object-fit:cover;
          border: 1px solid #ccc;
          border-radius: 60%;
          z-index: 1000;
          }
          .song-cover img{
            max-width: 50px;
            max-height: 60px;
            height: 50px;
            // object-fit: cover;
            border-radius: 60%;
          }
        `}
      </style>
    </>
  );
}
