'use client';
import { useSong } from '@/contexts/MediaContext';
import { useAuth } from '@/contexts/AuthContext';
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
  faCog,
  faTimes,
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
  getVideoData?:Function
}

export default function CustomVideoPlayer({ videoId, title,getVideoData=()=>{} }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [quality, setQuality] = useState('original');
  const [autoQuality, setAutoQuality] = useState(true);
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualityChanging, setQualityChanging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDoubleTappedSeek,setIsDoubleTappedSeek]=useState(false)
  const [isDoubleTappedRewind,setIsDoubleTappedRewind]=useState(false)
  const [showTitle,setShowTitle]=useState(true)
  const [viewTracked, setViewTracked] = useState(false)
  const {currentSong,setCurrentSong}=useSong()
  const { user, isAuthenticated } = useAuth()

  const [downloadRate, setDownloadRate] = useState(0);
  const [lastProgressTime, setLastProgressTime] = useState(0);
  const [lastBytesLoaded, setLastBytesLoaded] = useState(0);

  const measureDownloadRate = () => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return 0;
    
    const now = Date.now();
    const bytesLoaded = video.buffered.end(0) * 1000000; // Rough estimate
    
    if (lastProgressTime && now - lastProgressTime > 1000) {
      const timeDiff = (now - lastProgressTime) / 1000;
      const bytesDiff = bytesLoaded - lastBytesLoaded;
      const rate = bytesDiff / timeDiff / 1000000; // MB/s
      setDownloadRate(rate);
      setLastProgressTime(now);
      setLastBytesLoaded(bytesLoaded);
      return rate;
    }
    
    if (!lastProgressTime) {
      setLastProgressTime(now);
      setLastBytesLoaded(bytesLoaded);
    }
    
    return downloadRate;
  };

  const getOptimalQuality = (rate: number) => {
    if (rate > 2.5) return 'original'; 
    if (rate > 1.5) return 'high';
    if (rate > 0.5) return 'medium';
    return 'low';
  };

  const trackView = async (watchedPercentage: number) => {
    try {
      const payload: any = { watchedPercentage };
      
      if (isAuthenticated && user) {
        payload.userId = user._id;
      } else {
        const ipData = await (await fetch("https://api.ipify.org?format=json")).json();
        payload.ipAddress = ipData.ip;
      }

      const res=await fetch(`${API_URL}/videos/${videoId}/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      getVideoData(videoId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };


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
    

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      
      // Track view when 10% watched
      const watchedPercentage = (video.currentTime / video.duration) * 100;
      if (watchedPercentage >= 10 && !viewTracked) {
        trackView(watchedPercentage);
        setViewTracked(true);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => {
      setIsBuffering(false);
      setQualityChanging(false);
    };
    const updateDuration = () => setDuration(video.duration);
    
    const updateBufferHealth = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferAhead = bufferedEnd - video.currentTime;
        setBufferHealth(bufferAhead);
        
        // Measure download rate during progress updates
        if (autoQuality) measureDownloadRate();
      }
    };
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', updateBufferHealth);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', updateBufferHealth);
    };
  }, [document.fullscreenElement, viewTracked]);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video) return;
    setViewTracked(false)
    video.play()
    setIsPlaying(true)
    showControlsTemporarily()
    setAutoQuality(true);
    setLastProgressTime(0);
    setLastBytesLoaded(0);
  },[videoId])

  useEffect(() => {
    if (!autoQuality || qualityChanging) return;
    
    const timer = setTimeout(() => {
      // Downgrade if buffering or low buffer health
      if (isBuffering || bufferHealth < 5) {
        if (quality === 'original') changeQualityAuto('high');
        else if (quality === 'high') changeQualityAuto('medium');
        else if (quality === 'medium') changeQualityAuto('low');
      }
      // Upgrade if good buffer health and not buffering
      else if (bufferHealth > 10 && !isBuffering && downloadRate > 0) {
        const optimal = getOptimalQuality(downloadRate);
        if (optimal !== quality) {
          if (quality === 'low' && optimal !== 'low') changeQualityAuto('medium');
          else if (quality === 'medium' && (optimal === 'high' || optimal === 'original')) changeQualityAuto('high');
          else if (quality === 'high' && optimal === 'original') changeQualityAuto('original');
        }
      }
    }, isBuffering ? 2000 : 5000);
    
    return () => clearTimeout(timer);
  }, [isBuffering, bufferHealth, quality, autoQuality, qualityChanging]);

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

  // useEffect(() => {
  //   const handleOrientationChange = () => {
  //     if (window.innerWidth < 768 && window.orientation !== undefined) {
  //       if (Math.abs(window.orientation) === 90) {
  //         const container = containerRef.current;
  //         if (container && document.fullscreenElement === null) {
  //           container.requestFullscreen();
  //           setIsFullscreen(true);
  //         }
  //       } else {
  //         if (document.fullscreenElement !== null) {
  //           document.exitFullscreen();
  //           setIsFullscreen(false);
  //         }
  //       }
  //     }
  //   };

  //   window.addEventListener('orientationchange', handleOrientationChange);
  //   return () => window.removeEventListener('orientationchange', handleOrientationChange);
  // }, []);

  const hideControlsAfterDelay = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() =>{
      if (!showQualityMenu) {
        setShowControls(false)
        setShowTitle(false)
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  const showControlsTemporarily = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    setShowTitle(true)
    if (!showQualityMenu) {
      hideControlsAfterDelay();
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      setCurrentSong(null)
      if(typeof window!=='undefined'){
        localStorage.removeItem('currentSong')
        localStorage.removeItem('currentTime')
      }
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
    setAutoQuality(false); // Disable auto when manually changed
    
    setTimeout(() => {
      video.currentTime = currentTime;
      if (isPlaying) video.play();
    }, 100);
  };

  const changeQualityAuto = (newQuality: string) => {
    const video = videoRef.current;
    if (!video || newQuality === quality) return;
    
    const currentTime = video.currentTime;
    setQuality(newQuality);
    setQualityChanging(true);
    
    setTimeout(() => {
      video.currentTime = currentTime;
      if (isPlaying) video.play();
    }, 100);
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
        showControlsTemporarily()
      }}
      onMouseLeave={() => {
        if (!isFullscreen) {
          setShowControls(false)
          setShowTitle(false)
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchStartCapture={handleTouchStart}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        maxWidth: isFullscreen ? 'none' : (window.innerWidth > 992 ? '200%' : '100vw'),
        aspectRatio: isFullscreen ? 'auto' : '16/9',
        backgroundColor: '#000',
        borderRadius: isFullscreen ? '0' : '12px',
        overflow: 'hidden',
        boxShadow: isFullscreen ? 'none' : '0 8px 32px rgba(0,0,0,0.3)',
        touchAction: 'manipulation',
        margin: isFullscreen ? '0' : '0 auto',
        zIndex: isFullscreen ? 9999 : 'auto'
      }}
    >
      {isBuffering ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 15
        }}>
          <video
            autoPlay
            loop
            muted
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              display: 'block'
            }}
          >
            <source src="/CircleLoader.webm" type="video/webm" />
          </video>
        </div>
      ):(showControls && 
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
      )
      }
      {showControls && showQualityMenu && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(0,0,0,0.9)',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 25,
          minWidth: '150px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Quality Settings</div>
            <button
              onClick={() => setShowQualityMenu(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px'
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoQuality}
                onChange={(e) => {
                  setAutoQuality(e.target.checked);
                }}
                style={{ marginRight: '6px' }}
              />
              Auto Quality
            </label>
          </div>
          {['low', 'medium', 'high', 'original'].map((q) => (
            <div key={q} style={{ marginBottom: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="quality"
                  value={q}
                  checked={quality === q}
                  onChange={() => changeQuality(q)}
                  style={{ marginRight: '6px' }}
                />
                {q === 'low' ? '480p' : q === 'medium' ? '720p' : q === 'high' ? '1080p' : 'Original'}
                {autoQuality && quality === q && ' (Auto)'}
              </label>
            </div>
          ))}
        </div>
      )}
      {showControls && (
        <button
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          title="Quality Settings"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            zIndex: 20,
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faCog} />
        </button>
      )}
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