'use client';
import { useSong } from '@/contexts/MediaContext';
import { API_URL } from '@/services/api';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFastBackward,
  faFastForward,
  faStepForward,
  faStepBackward,
  faWindowMaximize,
  faWindowMinimize,
  faWindowRestore,
  faHouseChimneyWindow,
  faMinimize,
  faMaximize,
} from "@fortawesome/free-solid-svg-icons";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { faHome, faVideo, faMusic } from "@fortawesome/free-solid-svg-icons";
import {
  faVolumeUp,
  faVolumeDown,
  faVolumeMute,
} from "@fortawesome/free-solid-svg-icons";


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
  const [isDoubleTappedSeek,setIsDoubleTappedSeek]=useState(false)
  const [isDoubleTappedRewind,setIsDoubleTappedRewind]=useState(false)
  const [showTitle,setShowTitle]=useState(true)
  const {currentSong,setCurrentSong}=useSong()


  const videoUrl = `${API_URL}/videos/stream/${videoId}?quality=${quality}`;

  useEffect(() => {

    // if(document.fullscreenElement!==null){
    //   setShowTitle(true)
    // }
    // else{
    //   setInterval(()=>{
    //     setShowTitle(false)
    //   },10000)

    // }
    
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
  }, [document.fullscreenElement]);

  const hideControlsAfterDelay = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() =>{
      setShowControls(false)
      setShowTitle(false)
    }, 3000);
    setControlsTimeout(timeout);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    setShowTitle(true)
    hideControlsAfterDelay();
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      setCurrentSong(null)
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
  const handleDoubleTapSeek=(seekTime:number=0,action:string='seek')=>{
    const video=videoRef.current;
    if(!video) return;
    const newTime=seekTime;
    video.currentTime=newTime;
    setCurrentTime(newTime);
    if(action==='seek'){
      setIsDoubleTappedSeek(true)
      setTimeout(()=>{
        setIsDoubleTappedSeek(false)
      },300)
    }
    if(action==='rewind'){
      setIsDoubleTappedRewind(true)
      setTimeout(()=>{
        setIsDoubleTappedRewind(false)
      },300)
    }
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
      setVolume(1);
      setIsMuted(false);
      video.volume = 1;
      
    } else {
      video.volume = 0;
      setVolume(0);
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
    if(document.fullscreenElement===null){
      container.requestFullscreen();
      setIsFullscreen(true)
    }
    else{
      document.exitFullscreen();
      setIsFullscreen(false)
    }
    
   
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

  const progressPercentage=duration?(currentTime/duration)*100:0;
  const sliderFill = (pct: number) =>
    `linear-gradient(to right, #ff0000 ${pct}%, #333 ${pct}%)`;
 let lastTap=0;
  return (
    <div 
      ref={containerRef}
      onMouseMove={() => {
        // setShowControls(true)
        // setShowTitle(true) 
        // hideControlsAfterDelay();
        showControlsTemporarily()
      }}
      onMouseLeave={() => {
        setShowControls(false)
        setShowTitle(false)

      }}
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
      {title && showTitle && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 20,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.8))',
          backdropFilter: 'blur(12px)',
          padding: '10px 18px',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '600',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: '70%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {title}
        </div>
      )}
      {showControls && (
       <button
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
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
                borderRadius: '80%',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '90px',
                minHeight: '80px',
                flexShrink: 0,
                zIndex:20
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* {isPlaying ?<text style={{maxHeight:'40px',padding:'0',overflow:'hidden'}}>||</text> : '▶'} */}
              {isPlaying?<FontAwesomeIcon style={{color:'red'}} icon={faPause}/>:<FontAwesomeIcon style={{color:'red'}}  icon={faPlay}/>}
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
      
      <div onDoubleClick={()=>handleDoubleTapSeek(currentTime>5?currentTime-5:0,'rewind')} 
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
        opacity:`${isDoubleTappedRewind?1:0}`
      }}>
        <div style={{
          fontSize: '24px',
          // color: 'white',
          background: 'rgba(0, 0, 0, 0.27)',
          borderRadius: '50%',
          padding: '12px',
          opacity: showControls ? 0.9 : 0,
          transition: 'opacity 0.2s ease'
        }}>{<FontAwesomeIcon icon={faFastBackward}/>}</div>
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
        opacity: `${isDoubleTappedSeek?1:0}`
      }}>
        <div style={{
          fontSize: '24px',
          // color: 'white',
          color:'red',
          background: 'rgba(0, 0, 0, 0.27)',
          borderRadius: '50%',
          padding: '12px',
          opacity: showControls ? 0.9 : 0,
          transition: 'opacity 0.2s ease'
        }}>{<FontAwesomeIcon icon={faFastForward}/>}</div>
      </div>
      
      <div style={{
        // display:'flex',
        position: 'absolute',
        justifyContent:'space-between',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        padding: '24px 24px 16px',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
        zIndex: 15
      }}>
        <div style={{ marginBottom: '10px', position: 'relative', zIndex: 16 }}>
          <div style={{
            width: '100%',
            height: '3px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
            position: 'relative',
            cursor: 'pointer'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: 'red',
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
                backgroundColor: 'red',
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
            title="Seek"
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
            // justifyContent:'space-between',
            gap: window.innerWidth <= 768 ? '2px' : '8px', 
            flex: '1', 
            minWidth: '0' 
          }}>
            <button
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
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
                minWidth: '30px',
                minHeight: '40px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* {isPlaying ? <text style={{maxHeight:'20px',padding:'0',overflow:'hidden'}}>||</text> : <text style={{maxHeight:'24px',padding:'0',overflow:'hidden'}}>▶</text>} */}
             {isPlaying?<FontAwesomeIcon style={{color:'white'}} icon={faPause}/>:<FontAwesomeIcon style={{color:'white'}}  icon={faPlay}/>}
            </button>
            
            <span style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px',minWidth:'auto',width:'auto'}}>
              <button
                onClick={toggleMute}
                title="Mute/Unmute"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '6px',
                  minWidth: '25px',
                  minHeight: '32px'
                }}
              >
                {isMuted || volume === 0 ? <FontAwesomeIcon style={{color:'white'}} icon={faVolumeMute}/> : volume < 0.5 ? <FontAwesomeIcon style={{color:'white'}} icon={faVolumeDown}/> : <FontAwesomeIcon style={{color:'white'}} icon={faVolumeUp}/>}
              </button>
              <input
                type="range"
                className="volume-bar"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                title="Volume"
                style={{
                  background: sliderFill(volume * 100),
                  // maxWidth:'30px'

                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <select
              value={quality}
              onChange={(e) => changeQuality(e.target.value)}
              title="Change Quality"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '0px 0px',
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
              aria-placeholder='Toogle screen'
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0px',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease',
                minWidth: '20px',
                minHeight: '40px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {(isFullscreen&&document.fullscreenElement!==null) ? <FontAwesomeIcon icon={faMinimize}/> : <FontAwesomeIcon icon={faMaximize}/>}
            </button>
            <button
              onClick={()=> {
                if (videoRef.current) {
                  videoRef.current.requestPictureInPicture();
                }
              }}
              title="Picture-in-Picture"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0px',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease',
                minWidth: '20px',
                minHeight: '40px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* ◲ */}
              <FontAwesomeIcon icon={faWindowRestore}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}