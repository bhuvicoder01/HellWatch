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
attributes:{
    name: string;
    artistName: string;
    albumName: string;
}
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
    const [currentSong,setCurrentSong]=useState<SongContextType|null>(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('currentSong') || 'null') : null)
    const [lastPlayedTime,setLastPlayedTime]=useState()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

const loadSongs = async () => {
      const res = await api.get("/songs");
      setSongs(res.data);
    //   console.log(res.data);
    };

    const refreshSongs = async() => {
       await loadSongs();
    };
    useEffect(() => {

        loadSongs();
        if(typeof window !== 'undefined' && currentSong){
            localStorage.setItem('currentSong',JSON.stringify(currentSong))
        }
    }, [currentSong]);

    return (
        <SongsContext.Provider value={{ Songs,currentSong,setCurrentSong, refreshSongs }}>
            {children}
        </SongsContext.Provider>
    );
}
