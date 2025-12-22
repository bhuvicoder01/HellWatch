import { api, API_URL } from "@/services/api";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function VideoCard({Key, video, controls=false, detailPage=false }: {Key?: any, video: any, controls?: boolean, detailPage?: boolean }) {

    const [videoData, setVideoData] = useState(video);
    const [showThumbnail, setShowThumbnail] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
         const getVideoData = async (id: string) => {
                try {
                    const res=await api.get(`/videos/${id}`);
                    setVideoData(res.data);
                    return res.data;
                } catch (error) {
                    console.error('Error fetching video data:', error);
                    return null;
                    
                }
            }
            getVideoData(video.id);
    }, [video.id]);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [videoData.id]);
    
    const handleMouseOver = async () => {
        if (!detailPage && videoRef.current) {
            setShowThumbnail(false);
            try {
                await videoRef.current.play();
            } catch (error) {
                // Autoplay failed
            }
        }
    };

    const handleMouseLeave = () => {
        if (!detailPage && videoRef.current) {
            setShowThumbnail(true);
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };
    
    return (<>
        <div key={Key}  className={`video-card ${detailPage ? 'no-hover' : ''}`}>
            {detailPage ? (
                <Link href={`/videos/details?id=${videoData.id}`}>
                <video ref={videoRef} controls={controls}>
                    <source src={`${API_URL}/videos/stream/${videoData.id}`} type="video/mp4" />
                </video>
                </Link>
            ) : (
                <Link href={`/videos/details?id=${videoData.id}`}>
                    <div className="video-container" onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
                        {showThumbnail && videoData.thumbnail && (
                            <img
                                src={`${API_URL}/videos/${videoData.id}/thumbnail`}
                                alt="Video thumbnail"
                                className="thumbnail"
                                onError={() => setShowThumbnail(false)}
                            />
                        )}
                        <video 
                            ref={videoRef}
                            style={{ display: showThumbnail ? 'none' : 'block' }}
                            muted
                        >
                            <source src={`${API_URL}/videos/stream/${videoData.id}`} type="video/mp4" />
                        </video>
                    </div>
                </Link>
            )}
            <div className="video-info">
                <h3 className="title">{videoData.key}</h3>
                <p className="description">{new Date(videoData.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
        
        <style jsx>{`
            .video-container {
                position: relative;
                width: 100%;
                height: 200px;
                overflow: hidden;
                border-radius: 8px;
            }
            
            .thumbnail {
                width: 100%;
                height: 100%;
                object-fit: cover;
                cursor: pointer;
            }
        `}</style>
  </>  )
}