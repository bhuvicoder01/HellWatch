'use client';
import { api } from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";

const VideoContext=createContext({Videos: [], refreshVideos: () => {}});
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
    //   console.log(res.data);
    };
    
    const refreshVideos = () => {
        loadVideos();
    };
    useEffect(() => {

        loadVideos();
    }, []);

    return (
        <VideoContext.Provider value={{ Videos, refreshVideos }}>
            {children}
        </VideoContext.Provider>
    );
}

//Songs context
const SongsContext=createContext({Songs: [],currentSong:null as SongContextType|null,setCurrentSong:(song: SongContextType|null)=>{}, refreshSongs: () => {}});
export interface SongContextType {
id: string;
owner: string;
key: string;
title: string;
artist: string;
thumbnail: string;
}

export interface SongProviderProps {
    children: React.ReactNode;
}
export const useSong = () => {
    return useContext(SongsContext);
};
export function SongProvider({children }: SongProviderProps) {
    const [Songs,setSongs]=useState([]);
    const [currentSong,setCurrentSong]=useState<SongContextType|null>(null)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

const loadSongs = async () => {
      const res = await api.get("/songs");
      setSongs(res.data);
      console.log(res.data);
    };

    const refreshSongs = async() => {
       await loadSongs();
    };
    useEffect(() => {

        loadSongs();
    }, [currentSong]);

    return (
        <SongsContext.Provider value={{ Songs,currentSong,setCurrentSong, refreshSongs }}>
            {children}
        </SongsContext.Provider>
    );
}
