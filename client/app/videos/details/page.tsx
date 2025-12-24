'use client'
import VideoCard from "@/components/video/VideoCard";
import VideoGrid from "@/components/video/VideoGrid";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { useVideo } from "@/contexts/VideoContext";
import { api } from "@/services/api";
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense, useMemo } from "react";
import VideosPage from "../page";

function VideoDetailsContent() {
    const {Videos}=useVideo()
    const [videos,setVideos]=useState(Videos);
    const [video,setVideo]=useState<any>(null);
    const [windowWidth, setWindowWidth] = useState(0);
    const [showEdit, setShowEdit] = useState(true);
    
    const id=useSearchParams().get('id');
    
    useMemo(() => {
      setVideos(Videos);
    }, [Videos]);
    
    useEffect(() => {
        if (id) {
            getVideoData(id);
        }
        const handleResize = () => setWindowWidth(window.innerWidth);
        setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    const getVideoData = async (id: string) => {
        try {
            const res=await api.get(`/videos/${id}`);
            setVideo(res.data);
            return res.data;
        } catch (error) {
            console.error('Error fetching video data:', error);
            return null;
        }
    }
    
    if(!video){
        return <div>Loading...</div>
    }
    
    return (
        <div className="d-flex flex-column flex-lg-row mb-5" style={{gap: '20px'}}>
            <div className="flex-grow-1">
                <CustomVideoPlayer videoId={video.id} title={video.title} />
                <div className="mt-3">
                    <h3>{video?.title}</h3>
                    <p className="text-muted">Uploaded: {new Date(video.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="rows-lg-4" style={{maxWidth: '100%'}}>
                {videos.length!==0 && <VideosPage mobileDisplay={window.innerWidth<992?true:false} detailsPage={true}/>}
            </div>
        </div>
    )
}

export default function VideoDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VideoDetailsContent />
        </Suspense>
    )
}