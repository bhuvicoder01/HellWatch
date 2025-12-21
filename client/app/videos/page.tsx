'use client'
import { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";
import axios from "axios";
import VideoGrid from "@/components/video/VideoGrid";

function Videos() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showIcon, setShowIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const loadVideos = async () => {
      const res = await api.get("/videos");
      setVideos(res.data);
      
      console.log(API_URL)
    };
    loadVideos();
  }, []);

 return(<>
    <div className="container-fluid">
      <VideoGrid videos={videos} />
    </div>

 
 </>)
};

export default Videos;
