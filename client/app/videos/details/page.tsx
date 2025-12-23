'use client'
import VideoCard from "@/components/video/VideoCard";
import VideoGrid from "@/components/video/VideoGrid";
import { useVideo } from "@/contexts/VideoContext";
import { api } from "@/services/api";
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense, useMemo } from "react";
import VideosPage from "../page";

function VideoDetailsContent() {
    const {Videos}=useVideo()
    const [videos,setVideos]=useState(Videos);
    const [video,setVideo]=useState(null);
    const [windowWidth, setWindowWidth] = useState(0);
    
    const id=useSearchParams().get('id');
    // console.log("Video ID:", id);
    // setVideos(Videos);
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
    return (<>
        <div className="d-flex flex-column flex-lg-row p-4" style={{gap: '20px'}}>
            
            <div className="flex-grow-1">
            <VideoCard controls={true} detailPage={true} video={video} />
            </div>
            <div className="col-lg-4" style={{maxWidth: '100%'}}>
           {videos.length!==0 && <VideosPage />}

        </div>
        </div>
        
        </>
    )
}

export default function VideoDetailsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VideoDetailsContent />
        </Suspense>
    )
}