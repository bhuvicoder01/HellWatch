'use client'
import { useEffect, useState, useRef, useContext, useMemo, Suspense } from "react";
import { api } from "../../services/api";
import axios from "axios";
import VideoGrid from "@/components/video/VideoGrid";
import { useVideo } from "@/contexts/MediaContext";

function Videos({detailsPage=false,mobileDisplay=false}: {detailsPage?: boolean,mobileDisplay?:boolean}) {
  const {Videos}=useVideo()
  const [videos, setVideos] = useState(Videos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showIcon, setShowIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

useMemo(() => {
  setVideos(Videos);
}, [Videos]);


  // useEffect(() => {
  //   console.log(Videos)
  //   const loadVideos = async () => {
  //     // const res = await api.get("/videos");
  //     setVideos(Videos);
      
  //     console.log(API_URL)
  //   };
  //   loadVideos();
  // }, [Videos]);

 return(<>
    <div className="container-fluid">
      <VideoGrid detailsPage={detailsPage} mobileDisplay={mobileDisplay} videos={videos} />
    </div>

 
 </>)
};
export default function VideosPage({autoplay=false,detailsPage=false,mobileDisplay=false}: {autoplay?: boolean,detailsPage?:boolean,mobileDisplay?:boolean}) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Videos detailsPage={detailsPage} mobileDisplay={mobileDisplay} />
        </Suspense>
    )
}

