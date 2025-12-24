'use client';
import { API_URL } from '@/services/api';
import { useState, useRef, useEffect } from 'react';

interface CustomVideoPlayerProps {
  videoId: string;
  title?: string;
}

export default function CustomVideoPlayer({ videoId, title }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [quality, setQuality] = useState('high');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const videoUrl = `${API_URL}/videos/stream/${videoId}?quality=${quality}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const hideControlsAfterDelay = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    hideControlsAfterDelay();
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const handleDoubleTapSeek=(seekTime:number=0)=>{
    const video=videoRef.current;
    if(!video) return;
    const newTime=seekTime;
    video.currentTime=newTime;
    setCurrentTime(newTime);
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const changeQuality = (newQuality: string) => {
    const video = videoRef.current;
    if (!video) return;
    
    const currentTime = video.currentTime;
    setQuality(newQuality);
    
    setTimeout(() => {
      video.currentTime = currentTime;
      if (isPlaying) video.play();
    }, 100);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    showControlsTemporarily();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const video = videoRef.current;
    if (!video || !touch) return;

    const rect = video.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    if (x > rect.width * 0.3 && x < rect.width * 0.7) {
      togglePlay();
    } else if (x > rect.width * 0.7) {
      video.currentTime = Math.min(video.currentTime + 10, duration);
    } else if (x < rect.width * 0.3) {
      video.currentTime = Math.max(video.currentTime - 10, 0);
    }
  };

  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
 let lastTap=0;
  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      // onMouseLeave={() => setShowControls(false)}
      onTouchStart={handleTouchStart}
      // onTouchEnd={handleTouchEnd}
      onTouchStartCapture={handleTouchStart}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: window.innerWidth > 992 ? '200%' : '100vw',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        touchAction: 'manipulation',
        margin: '0 auto'
      }}
    >
      {title && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 20,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          padding: '8px 16px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {title}
        </div>
      )}
      {showControls&& (
       <button
              onClick={togglePlay}
              style={{
                background: 'none',
                position:'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                border: 'none',
                fontSize: '50px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
      )}
      
      <video
        onDoubleClick={handleDoubleClick}
        ref={videoRef}
        src={videoUrl}
        style={{ 
          width: '100%', 
          height: '100%',
          objectFit: 'contain',
          display: 'block' 
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      <div onDoubleClick={()=>handleDoubleTapSeek(currentTime>5?currentTime-5:0)} 
      onTouchEnd={(e)=>{
        const DBL_TAP_THRESHOLD = 1000;
        const tapLength=(new Date().getTime())-lastTap;
        if (tapLength < DBL_TAP_THRESHOLD && tapLength > 0) {
        // Double tap detected
        // console.log('Double Tapped!');
        handleDoubleTapSeek(currentTime>5?currentTime-5:0)
        // Prevent the default behavior (like mobile browser zoom)
        e.preventDefault();

    } 
    lastTap = (new Date().getTime())
      }} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30%',
        height: '100%',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1
      }}>
        <div style={{
          fontSize: '24px',
          // color: 'white',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '50%',
          padding: '12px',
          opacity: showControls ? 0.7 : 0,
          transition: 'opacity 0.2s ease'
        }}>{`<<`}</div>
      </div>
      
      <div onDoubleClick={()=>handleDoubleTapSeek(duration-currentTime<5?currentTime+((duration-currentTime)):currentTime+5)} 
      onTouchEnd={(e)=>{
       
        const DBL_TAP_THRESHOLD = 2000;
        const tapLength=(new Date().getTime())-lastTap;
        if (tapLength < DBL_TAP_THRESHOLD && tapLength > 0) {
        // Double tap detected
        console.log('Double Tapped!');
        handleDoubleTapSeek(duration-currentTime<5?currentTime+((duration-currentTime)):currentTime+5)
        // Prevent the default behavior (like mobile browser zoom)
        e.preventDefault();
    } else {
        // First tap or a tap after the threshold
        // console.log('Single Tap Detected (might be first tap)');
    }
    lastTap = (new Date().getTime())
      }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '30%',
        height: '100%',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1
      }}>
        <div style={{
          fontSize: '24px',
          // color: 'white',
          color:'black',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '50%',
          padding: '12px',
          opacity: showControls ? 0.7 : 0,
          transition: 'opacity 0.2s ease'
        }}>{`>>`}</div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        padding: '24px 20px 16px',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
        zIndex: 15
      }}>
        <div style={{ marginBottom: '16px', position: 'relative', zIndex: 16 }}>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
            position: 'relative',
            cursor: 'pointer'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: '#ff0050',
              borderRadius: '3px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                backgroundColor: '#ff0050',
                borderRadius: '50%',
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.2s ease'
              }} />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{
              position: 'absolute',
              top: '-2px',
              left: 0,
              width: '100%',
              height: '10px',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 17
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
          flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap',
          gap: window.innerWidth <= 768 ? '4px' : '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: window.innerWidth <= 768 ? '8px' : '12px', 
            flex: '1', 
            minWidth: '0' 
          }}>
            <button
              onClick={togglePlay}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <span style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={toggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '6px',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
              >
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '60px',
                  height: '4px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <select
              value={quality}
              onChange={(e) => changeQuality(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
                minHeight: '32px'
              }}
            >
              <option value="low">480p</option>
              <option value="medium">720p</option>
              <option value="high">1080p</option>
            </select>
            
            <button
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease',
                minWidth: '40px',
                minHeight: '40px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}