'use client';
import { api } from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";

const VideoContext=createContext({Videos: []});
export interface VideoContextType {
videos: any;
}
export interface VideoProviderProps {
    children: React.ReactNode;
}

export const useVideo = () => {
    return useContext(VideoContext);
};
export function VideoProvider({children }: VideoProviderProps) {
    const [Videos,setVideos]=useState([]);
    const [thumbnail,setThumbnail]=useState<string|Blob|null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

const loadVideos = async () => {
      const res = await api.get("/videos");
      setVideos(res.data);
      console.log(res.data);
    };
    useEffect(() => {

        loadVideos();
    }, []);

    return (
        <VideoContext.Provider value={{ Videos }}>

            {children}
        </VideoContext.Provider>
    );
}
